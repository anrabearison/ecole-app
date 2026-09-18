"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/lib/utils"
import { getEffectiveCoefficient, getEffectiveCoefficientsBatch } from "@/lib/actions/subject-coefficient"

export type SubjectAverage = {
  subjectId: string
  subjectName: string
  coefficient: number
  average: number
}

export type GeneralAverage = {
  studentId: string
  average: number
}

export type ClassRank = {
  studentId: string
  rank: number
  totalStudents: number
}

export type SubjectRank = {
  studentId: string
  subjectId: string
  rank: number
  totalStudents: number
}

/**
 * Batch calculate subject averages for multiple students in a period.
 * Returns a Map of (studentId, subjectId) -> average
 * Optimized to avoid N+1 queries by fetching all grades in one query.
 */
export async function calculateSubjectAveragesBatch(
  studentIds: string[],
  subjectIds: string[],
  periodId: string,
  dailySelectionMap: Map<string, string[] | null>,
  schoolId: string
): Promise<ActionResult<Map<string, Map<string, number>>>> {
  if (!studentIds.length || !subjectIds.length) {
    return { success: true, data: new Map() }
  }

  try {
    // Get period weighting configuration
    const period = await prisma.period.findUnique({
      where: { id: periodId },
      select: { examWeight: true, dailyWeight: true },
    })

    if (!period) {
      return { success: false, error: "Period not found" }
    }

    // Get all grades for all students, subjects, and period in ONE query
    const allGrades = await prisma.grade.findMany({
      where: {
        studentId: { in: studentIds },
        assessment: {
          subjectId: { in: subjectIds },
          periodId,
          schoolId,
        },
      },
      select: {
        studentId: true,
        value: true,
        assessment: {
          select: { id: true, type: true, subjectId: true },
        },
      },
    })

    // Build grade lookup: (studentId, subjectId) -> grades[]
    const gradeLookup = new Map<string, Array<{ value: number; type: string; assessmentId: string }>>()
    for (const grade of allGrades) {
      const key = `${grade.studentId}:${grade.assessment.subjectId}`
      if (!gradeLookup.has(key)) {
        gradeLookup.set(key, [])
      }
      gradeLookup.get(key)!.push({
        value: grade.value,
        type: grade.assessment.type,
        assessmentId: grade.assessment.id,
      })
    }

    // Calculate averages for each (studentId, subjectId) combination
    const result = new Map<string, Map<string, number>>()
    
    for (const studentId of studentIds) {
      const subjectMap = new Map<string, number>()
      
      for (const subjectId of subjectIds) {
        const key = `${studentId}:${subjectId}`
        const grades = gradeLookup.get(key) || []
        
        let examSum = 0
        let examCount = 0
        let dailySum = 0
        let dailyCount = 0
        
        const selectedDailyIds = dailySelectionMap.get(subjectId)
        
        for (const grade of grades) {
          if (grade.type === "EXAM") {
            examSum += grade.value
            examCount++
          } else {
            // DAILY: only include if no filter, or if this assessment is in the selection
            const isSelected =
              selectedDailyIds === undefined || selectedDailyIds === null
                ? true
                : selectedDailyIds.includes(grade.assessmentId)
            if (isSelected) {
              dailySum += grade.value
              dailyCount++
            }
          }
        }
        
        const examAvg = examCount > 0 ? examSum / examCount : 0
        const dailyAvg = dailyCount > 0 ? dailySum / dailyCount : 0
        
        // Weighted average
        const average = examAvg * period.examWeight + dailyAvg * period.dailyWeight
        subjectMap.set(subjectId, average)
      }
      
      result.set(studentId, subjectMap)
    }

    return { success: true, data: result }
  } catch (error) {
    console.error("Error calculating subject averages batch:", error)
    return { success: false, error: "Erreur lors du calcul des moyennes matière" }
  }
}

/**
 * Batch calculate general averages for multiple students in a period.
 * Returns a Map of studentId -> general average
 * Optimized to avoid N+1 queries by using batch subject averages.
 */
export async function calculateGeneralAveragesBatch(
  studentIds: string[],
  periodId: string,
  dailySelectionMap: Map<string, string[] | null>,
  schoolId: string
): Promise<ActionResult<Map<string, number>>> {
  if (!studentIds.length) {
    return { success: true, data: new Map() }
  }

  try {
    // Get all subjects for this period and school
    const assessments = await prisma.assessment.findMany({
      where: { periodId, schoolId },
      select: { subjectId: true },
      distinct: ["subjectId"],
    })

    const subjectIds = assessments.map((a) => a.subjectId)

    if (subjectIds.length === 0) {
      return { success: true, data: new Map() }
    }

    // Get all subject coefficients in batch
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds }, schoolId },
      select: {
        id: true,
        classroom: {
          select: { schoolGradeId: true, trackId: true },
        },
      },
    })

    const schoolGradeId = students[0]?.classroom?.schoolGradeId ?? null
    const trackId = students[0]?.classroom?.trackId ?? null

    let coefficientMap = new Map<string, number>()
    if (schoolGradeId) {
      const batchResult = await getEffectiveCoefficientsBatch(subjectIds, schoolGradeId, trackId, schoolId)
      batchResult.forEach((coeff, subjectId) => {
        coefficientMap.set(subjectId, coeff)
      })
    }

    // Get all subject averages in batch
    const batchResult = await calculateSubjectAveragesBatch(
      studentIds,
      subjectIds,
      periodId,
      dailySelectionMap,
      schoolId
    )

    if (!batchResult.success) {
      return { success: false, error: batchResult.error }
    }

    // Calculate general averages from subject averages
    const result = new Map<string, number>()
    
    for (const studentId of studentIds) {
      const subjectMap = batchResult.data.get(studentId)
      if (!subjectMap) {
        result.set(studentId, 0)
        continue
      }

      let totalWeighted = 0
      let totalCoefficients = 0

      for (const [subjectId, average] of subjectMap) {
        const coefficient = coefficientMap.get(subjectId) || 1.0
        totalWeighted += average * coefficient
        totalCoefficients += coefficient
      }

      const generalAverage = totalCoefficients > 0 ? totalWeighted / totalCoefficients : 0
      result.set(studentId, generalAverage)
    }

    return { success: true, data: result }
  } catch (error) {
    console.error("Error calculating general averages batch:", error)
    return { success: false, error: "Erreur lors du calcul des moyennes générales" }
  }
}

/**
 * Calculate subject average for a student in a period.
 * Weighted average based on Period.examWeight/dailyWeight.
 *
 * @param selectedDailyAssessmentIds - Optional list of DAILY assessment IDs to include.
 *   - undefined / null → use ALL daily grades (default behaviour for individual report card)
 *   - empty array []   → no daily grades included (daily average = 0)
 *   - non-empty array  → only grades from those specific assessments are averaged
 */
export async function calculateSubjectAverage(
  studentId: string,
  subjectId: string,
  periodId: string,
  selectedDailyAssessmentIds?: string[] | null,
): Promise<ActionResult<number>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  // Check permissions based on role
  if (!can(session.user.role, "view", "grade", { 
    studentId: session.user.studentId || undefined, 
    schoolId: session.user.schoolId || undefined 
  })) {
    return { success: false, error: "Forbidden" }
  }

  try {
    // Get period weighting configuration
    const period = await prisma.period.findUnique({
      where: { id: periodId },
      select: { examWeight: true, dailyWeight: true },
    })

    if (!period) {
      return { success: false, error: "Period not found" }
    }

    // Build DAILY filter: restrict to selected assessments if a selection was provided
    const dailyAssessmentFilter =
      selectedDailyAssessmentIds !== undefined && selectedDailyAssessmentIds !== null
        ? { id: { in: selectedDailyAssessmentIds } }
        : {}  // no filter → all DAILY assessments

    // Get all grades for this student, subject, and period
    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        assessment: {
          subjectId,
          periodId,
          schoolId: session.user.schoolId,
        },
      },
      select: {
        value: true,
        assessment: {
          select: { id: true, type: true },
        },
      },
    })

    if (grades.length === 0) {
      return { success: true, data: 0 }
    }

    // Calculate weighted average
    let examSum = 0
    let examCount = 0
    let dailySum = 0
    let dailyCount = 0

    for (const grade of grades) {
      if (grade.assessment.type === "EXAM") {
        examSum += grade.value
        examCount++
      } else {
        // DAILY: only include if no filter, or if this assessment is in the selection
        const isSelected =
          selectedDailyAssessmentIds === undefined || selectedDailyAssessmentIds === null
            ? true
            : selectedDailyAssessmentIds.includes(grade.assessment.id)
        if (isSelected) {
          dailySum += grade.value
          dailyCount++
        }
      }
    }

    const examAvg = examCount > 0 ? examSum / examCount : 0
    const dailyAvg = dailyCount > 0 ? dailySum / dailyCount : 0

    // Weighted average
    const average = examAvg * period.examWeight + dailyAvg * period.dailyWeight

    return { success: true, data: average }
  } catch (error) {
    console.error("Error calculating subject average:", error)
    return { success: false, error: "Erreur lors du calcul de la moyenne matière" }
  }
}

/**
 * Calculate general average for a student in a period.
 * Weighted by subject coefficients.
 *
 * @param dailySelectionMap - Optional map of subjectId → selectedDailyAssessmentIds.
 *   Pass this when generating class report cards with selective daily notes.
 *   Omit (or pass undefined) to use all daily notes (individual report card behaviour).
 */
export async function calculateGeneralAverage(
  studentId: string,
  periodId: string,
  dailySelectionMap?: Map<string, string[] | null>,
): Promise<ActionResult<number>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  if (!can(session.user.role, "view", "grade", { 
    studentId: session.user.studentId || undefined, 
    schoolId: session.user.schoolId || undefined 
  })) {
    return { success: false, error: "Forbidden" }
  }

  try {
    // Get the student's current classroom to resolve schoolGradeId and trackId
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        classroomId: true,
        classroom: {
          select: { schoolGradeId: true, trackId: true },
        },
      },
    })

    const schoolGradeId = student?.classroom?.schoolGradeId ?? null
    const trackId = student?.classroom?.trackId ?? null

    // Get all subjects with grades for this student in this period
    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        assessment: {
          periodId,
          schoolId: session.user.schoolId,
        },
      },
      include: {
        assessment: {
          include: {
            subject: {
              select: { id: true, name: true, coefficient: true },
            },
          },
        },
      },
    })

    if (grades.length === 0) {
      return { success: true, data: 0 }
    }

    // Group by subject
    const uniqueSubjectIds = [...new Set(grades.filter((g) => g.assessment?.subject?.id).map((g) => g.assessment.subject.id))]

    // Resolve effective coefficient for each subject (with fallback chain)
    const subjectCoefficients = new Map<string, number>()
    if (schoolGradeId) {
      // Use batch version to avoid N+1 queries
      const batchCoefficients = await getEffectiveCoefficientsBatch(
        uniqueSubjectIds,
        schoolGradeId,
        trackId,
        session.user.schoolId!
      )
      batchCoefficients.forEach((coeff, subjectId) => {
        subjectCoefficients.set(subjectId, coeff)
      })
    } else {
      // Fallback: use Subject.coefficient when classroom/grade is not resolved
      for (const grade of grades) {
        if (!subjectCoefficients.has(grade.assessment.subject.id)) {
          subjectCoefficients.set(grade.assessment.subject.id, grade.assessment.subject.coefficient)
        }
      }
    }

    // Calculate average per subject (batch processing to avoid N+1)
    const subjectAverages = new Map<string, { average: number; coefficient: number }>()
    for (const subjectId of uniqueSubjectIds) {
      subjectAverages.set(subjectId, {
        average: 0,
        coefficient: subjectCoefficients.get(subjectId) ?? 1.0,
      })
    }

    // Batch calculate subject averages
    await Promise.all(
      uniqueSubjectIds.map(async (subjectId) => {
        const selectedDailyIds = dailySelectionMap?.get(subjectId)
        const subjectAvgResult = await calculateSubjectAverage(studentId, subjectId, periodId, selectedDailyIds)
        if (subjectAvgResult.success) {
          subjectAverages.get(subjectId)!.average = subjectAvgResult.data
        }
      })
    )

    // Weighted general average
    let weightedSum = 0
    let totalCoefficient = 0

    for (const data of subjectAverages.values()) {
      weightedSum += data.average * data.coefficient
      totalCoefficient += data.coefficient
    }

    const average = totalCoefficient > 0 ? weightedSum / totalCoefficient : 0

    return { success: true, data: average }
  } catch (error: any) {
    console.error("Error calculating general average:", error)
    return { success: false, error: "Erreur lors du calcul de la moyenne générale" }
  }
}

/**
 * Calculate class rank for a student in a period
 */
export async function calculateClassRank(
  studentId: string,
  classroomId: string,
  periodId: string
): Promise<ActionResult<ClassRank>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  if (!can(session.user.role, "view", "grade", { 
    studentId: session.user.studentId || undefined, 
    schoolId: session.user.schoolId || undefined 
  })) {
    return { success: false, error: "Forbidden" }
  }

  try {
    // Get all students in the classroom
    const students = await prisma.student.findMany({
      where: {
        classroomId,
        schoolId: session.user.schoolId,
      },
      select: { id: true },
    })

    // Calculate general average for each student (batch processing)
    const studentAverages: Array<{ studentId: string; average: number }> = []
    
    const averageResults = await Promise.all(
      students.map(student => calculateGeneralAverage(student.id, periodId))
    )
    
    for (let i = 0; i < students.length; i++) {
      const avgResult = averageResults[i]
      if (avgResult.success) {
        studentAverages.push({
          studentId: students[i].id,
          average: avgResult.data,
        })
      }
    }

    // Sort by average descending assign ranks
    studentAverages.sort((a, b) => b.average - a.average)

    const studentRank = studentAverages.findIndex((s) => s.studentId === studentId) + 1
    const totalStudents = studentAverages.length

    return {
      success: true,
      data: {
        studentId,
        rank: studentRank > 0 ? studentRank : 0,
        totalStudents,
      },
    }
  } catch (error) {
    console.error("Error calculating class rank:", error)
    return { success: false, error: "Erreur lors du calcul du classement" }
  }
}

/**
 * Get all subject averages for a student in a period.
 *
 * @param dailySelectionMap - Optional map of subjectId → selectedDailyAssessmentIds.
 *   Pass this when generating class report cards with selective daily notes.
 */
export async function getStudentSubjectAverages(
  studentId: string,
  periodId: string,
  dailySelectionMap?: Map<string, string[] | null>,
): Promise<ActionResult<SubjectAverage[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  if (!can(session.user.role, "view", "grade", { 
    studentId: session.user.studentId || undefined, 
    schoolId: session.user.schoolId || undefined 
  })) {
    return { success: false, error: "Forbidden" }
  }

  try {
    // Get the student's classroom to resolve schoolGradeId and trackId
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        classroom: { select: { schoolGradeId: true, trackId: true } },
      },
    })

    const schoolGradeId = student?.classroom?.schoolGradeId ?? null
    const trackId = student?.classroom?.trackId ?? null

    // Get all subjects with grades for this student in this period
    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        assessment: {
          periodId,
          schoolId: session.user.schoolId,
        },
      },
      include: {
        assessment: {
          include: {
            subject: {
              select: { id: true, name: true, coefficient: true },
            },
          },
        },
      },
    })

    if (grades.length === 0) {
      return { success: true, data: [] }
    }

    // Get unique subjects
    const uniqueSubjects = Array.from(
      new Map(grades.filter((g) => g.assessment?.subject?.id).map((g) => [g.assessment.subject.id, g.assessment.subject])).values()
    )

    // Resolve effective coefficients in batch to avoid N+1
    const subjectIds = uniqueSubjects.map(s => s.id)
    const subjectCoefficients = new Map<string, number>()
    
    if (schoolGradeId) {
      const batchCoefficients = await getEffectiveCoefficientsBatch(
        subjectIds,
        schoolGradeId,
        trackId,
        session.user.schoolId!
      )
      batchCoefficients.forEach((coeff, subjectId) => {
        subjectCoefficients.set(subjectId, coeff)
      })
    } else {
      // Fallback: use Subject.coefficient
      for (const subject of uniqueSubjects) {
        subjectCoefficients.set(subject.id, subject.coefficient)
      }
    }

    // Calculate average for each subject (batch processing)
    const subjectAverages: SubjectAverage[] = []
    
    const averageResults = await Promise.all(
      uniqueSubjects.map(subject => {
        const selectedDailyIds = dailySelectionMap?.get(subject.id)
        return calculateSubjectAverage(studentId, subject.id, periodId, selectedDailyIds)
      })
    )
    
    for (let i = 0; i < uniqueSubjects.length; i++) {
      const subject = uniqueSubjects[i]
      const avgResult = averageResults[i]
      
      if (avgResult.success) {
        subjectAverages.push({
          subjectId: subject.id,
          subjectName: subject.name,
          coefficient: subjectCoefficients.get(subject.id) ?? subject.coefficient,
          average: avgResult.data,
        })
      }
    }

    return { success: true, data: subjectAverages }
  } catch (error: any) {
    console.error("Error getting student subject averages:", error)
    return { success: false, error: "Erreur lors de la récupération des moyennes matière" }
  }
}

/**
 * Calculate subject rank for a student in a classroom for a period
 */
export async function calculateSubjectRank(
  studentId: string,
  subjectId: string,
  classroomId: string,
  periodId: string,
  dailySelectionMap?: Map<string, string[] | null>
): Promise<ActionResult<SubjectRank>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  if (!can(session.user.role, "view", "grade", {
    studentId: session.user.studentId || undefined,
    schoolId: session.user.schoolId || undefined
  })) {
    return { success: false, error: "Forbidden" }
  }

  try {
    // Get all students in the classroom
    const students = await prisma.student.findMany({
      where: {
        classroomId,
        schoolId: session.user.schoolId,
      },
      select: { id: true },
    })

    // Calculate subject average for each student (batch processing)
    const studentAverages: Array<{ studentId: string; average: number }> = []
    
    const averageResults = await Promise.all(
      students.map(student => {
        const selectedDailyIds = dailySelectionMap?.get(subjectId)
        return calculateSubjectAverage(student.id, subjectId, periodId, selectedDailyIds)
      })
    )
    
    for (let i = 0; i < students.length; i++) {
      const avgResult = averageResults[i]
      if (avgResult.success) {
        studentAverages.push({
          studentId: students[i].id,
          average: avgResult.data,
        })
      }
    }

    // Sort by average descending and assign ranks
    studentAverages.sort((a, b) => b.average - a.average)

    const studentRank = studentAverages.findIndex((s) => s.studentId === studentId) + 1
    const totalStudents = studentAverages.length

    return {
      success: true,
      data: {
        studentId,
        subjectId,
        rank: studentRank > 0 ? studentRank : 0,
        totalStudents,
      },
    }
  } catch (error) {
    console.error("Error calculating subject rank:", error)
    return { success: false, error: "Erreur lors du calcul du rang matière" }
  }
}


