"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/lib/utils"
import { getSelectedDailyAssessmentIds } from "./daily-grade-selection"
import { calculateSubjectAverage, calculateGeneralAverage, calculateSubjectRank } from "./average"
import { calculateAppreciation, calculateTotalNotes, calculateTotalCoefficients } from "@/lib/utils/calculations"
import { getEffectiveCoefficient } from "./subject-coefficient"

export type StudentGradeData = {
  studentId: string
  studentFirstName: string | null
  studentLastName: string
  classNumber: number | null
  subjects: SubjectGradeData[]
  generalAverage: number
  totalNotes: number
  totalCoefficients: number
  appreciation: string
  classRank: number
  totalStudents: number
}

export type SubjectGradeData = {
  subjectId: string
  subjectName: string
  coefficient: number
  dailyGrades: DailyGradeItem[]
  examGrades: ExamGradeItem[]
  dailyAverage: number
  examAverage: number
  weightedAverage: number
  finalNote: number
  rank: number
  totalStudents: number
}

export type DailyGradeItem = {
  assessmentId: string
  assessmentTitle: string | null
  assessmentDate: string
  value: number
  selected: boolean
}

export type ExamGradeItem = {
  assessmentId: string
  assessmentTitle: string | null
  assessmentDate: string
  value: number
}

export type ClassGradesResult = {
  className: string
  periodName: string
  schoolYear: string
  examWeight: number
  dailyWeight: number
  students: StudentGradeData[]
}

/**
 * Get all grades for a classroom in a period, applying daily grade selections.
 * Accessible to teachers and admins with view grade permissions.
 */
export async function getClassGrades(
  classroomId: string,
  periodId: string
): Promise<ActionResult<ClassGradesResult>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  if (!can(session.user.role, "view", "grade", { schoolId: session.user.schoolId })) {
    return { success: false, error: "Forbidden" }
  }

  try {
    const schoolId = session.user.schoolId

    // Get classroom and period info
    const [classroom, period] = await Promise.all([
      prisma.classroom.findUnique({
        where: { id: classroomId },
        include: {
          schoolGrade: true,
          track: true,
        },
      }),
      prisma.period.findUnique({
        where: { id: periodId },
      }),
    ])

    if (!classroom || classroom.schoolId !== schoolId) {
      return { success: false, error: "Classe non trouvée" }
    }

    if (!period || period.schoolId !== schoolId) {
      return { success: false, error: "Période non trouvée" }
    }

    // Build class name
    let className = classroom.schoolGrade?.name || ""
    if (classroom.track) className += ` ${classroom.track.name}`
    if (classroom.section) className += ` ${classroom.section}`

    // Get all students in the classroom
    const students = await prisma.student.findMany({
      where: { classroomId, schoolId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        classNumber: true,
        classroom: {
          select: { schoolGradeId: true, trackId: true },
        },
      },
    })

    if (students.length === 0) {
      return { success: true, data: {
        className,
        periodName: period.name,
        schoolYear: period.schoolYear,
        examWeight: period.examWeight,
        dailyWeight: period.dailyWeight,
        students: [],
      }}
    }

    // Get all subjects with grades in this classroom/period
    const assessments = await prisma.assessment.findMany({
      where: { classroomId, periodId, schoolId },
      select: { subjectId: true },
      distinct: ["subjectId"],
    })

    const subjectIds = assessments.map((a) => a.subjectId)

    // Build daily selection map for all subjects
    const dailySelectionMap = new Map<string, string[] | null>()
    for (const subjectId of subjectIds) {
      const selectedIds = await getSelectedDailyAssessmentIds(classroomId, subjectId, periodId, schoolId)
      dailySelectionMap.set(subjectId, selectedIds)
    }

    // Get all DAILY assessments for this classroom/period
    const dailyAssessments = await prisma.assessment.findMany({
      where: { classroomId, periodId, schoolId, type: "DAILY" },
      select: { id: true, subjectId: true, title: true, date: true },
      orderBy: { date: "asc" },
    })

    // Get all EXAM assessments for this classroom/period
    const examAssessments = await prisma.assessment.findMany({
      where: { classroomId, periodId, schoolId, type: "EXAM" },
      select: { id: true, subjectId: true, title: true, date: true },
      orderBy: { date: "asc" },
    })

    // Get all grades for all students in this classroom/period
    const allGrades = await prisma.grade.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        assessment: { periodId, schoolId },
      },
      select: {
        studentId: true,
        assessmentId: true,
        value: true,
      },
    })

    // Build grade lookup: studentId -> assessmentId -> value
    const gradeLookup = new Map<string, Map<string, number>>()
    for (const grade of allGrades) {
      if (!gradeLookup.has(grade.studentId)) {
        gradeLookup.set(grade.studentId, new Map())
      }
      gradeLookup.get(grade.studentId)!.set(grade.assessmentId, grade.value)
    }

    // Build assessment lookup
    const dailyAssessmentLookup = new Map(dailyAssessments.map((a) => [a.id, a]))
    const examAssessmentLookup = new Map(examAssessments.map((a) => [a.id, a]))

    // Process each student
    const studentGradeData: StudentGradeData[] = []

    for (const student of students) {
      const schoolGradeId = student.classroom?.schoolGradeId ?? null
      const trackId = student.classroom?.trackId ?? null
      const studentGrades = gradeLookup.get(student.id) || new Map()

      // Process each subject
      const subjectGrades: SubjectGradeData[] = []

      for (const subjectId of subjectIds) {
        const selectedDailyIds = dailySelectionMap.get(subjectId)

        // Get daily grades for this student and subject
        const dailyGrades: DailyGradeItem[] = []
        let dailySum = 0
        let dailyCount = 0

        for (const assessment of dailyAssessments) {
          if (assessment.subjectId !== subjectId) continue

          const value = studentGrades.get(assessment.id)
          const isSelected =
            selectedDailyIds === undefined || selectedDailyIds === null
              ? true
              : selectedDailyIds.includes(assessment.id)

          if (value !== undefined && isSelected) {
            dailyGrades.push({
              assessmentId: assessment.id,
              assessmentTitle: assessment.title,
              assessmentDate: assessment.date.toISOString().split("T")[0],
              value,
              selected: true,
            })
            dailySum += value
            dailyCount++
          } else if (value !== undefined && !isSelected) {
            dailyGrades.push({
              assessmentId: assessment.id,
              assessmentTitle: assessment.title,
              assessmentDate: assessment.date.toISOString().split("T")[0],
              value,
              selected: false,
            })
          }
        }

        const dailyAverage = dailyCount > 0 ? dailySum / dailyCount : 0

        // Get exam grades for this student and subject
        const examGrades: ExamGradeItem[] = []
        let examSum = 0
        let examCount = 0

        for (const assessment of examAssessments) {
          if (assessment.subjectId !== subjectId) continue

          const value = studentGrades.get(assessment.id)
          if (value !== undefined) {
            examGrades.push({
              assessmentId: assessment.id,
              assessmentTitle: assessment.title,
              assessmentDate: assessment.date.toISOString().split("T")[0],
              value,
            })
            examSum += value
            examCount++
          }
        }

        const examAverage = examCount > 0 ? examSum / examCount : 0

        // Calculate weighted average (MJ+COMP)/2 with 50/50 weights
        const weightedAverage = examAverage * period.examWeight + dailyAverage * period.dailyWeight

        // Get effective coefficient
        const effectiveCoefficient = schoolGradeId
          ? await getEffectiveCoefficient(subjectId, schoolGradeId, trackId, schoolId)
          : 1.0

        // Calculate final note: COEF * (MJ+COMP)/2
        const finalNote = effectiveCoefficient * weightedAverage

        // Get subject name
        const subject = await prisma.subject.findUnique({
          where: { id: subjectId },
          select: { name: true },
        })

        subjectGrades.push({
          subjectId,
          subjectName: subject?.name || "Unknown",
          coefficient: effectiveCoefficient,
          dailyGrades,
          examGrades,
          dailyAverage,
          examAverage,
          weightedAverage,
          finalNote,
          rank: 0, // Will be calculated after all students are processed
          totalStudents: 0, // Will be calculated after all students are processed
        })
      }

      // Calculate general average
      const generalAvgResult = await calculateGeneralAverage(student.id, periodId, dailySelectionMap)
      const generalAverage = generalAvgResult.success ? generalAvgResult.data : 0

      studentGradeData.push({
        studentId: student.id,
        studentFirstName: student.firstName,
        studentLastName: student.lastName,
        classNumber: student.classNumber,
        subjects: subjectGrades,
        generalAverage,
        totalNotes: 0, // Will be calculated after
        totalCoefficients: 0, // Will be calculated after
        appreciation: "", // Will be calculated after
        classRank: 0, // Will be calculated after
        totalStudents: students.length,
      })
    }

    // Calculate subject ranks for all students
    for (const subjectId of subjectIds) {
      const subjectRankMap = new Map<string, number>()
      const studentSubjectAverages: Array<{ studentId: string; average: number }> = []

      for (const student of students) {
        const selectedDailyIds = dailySelectionMap.get(subjectId)
        const avgResult = await calculateSubjectAverage(student.id, subjectId, periodId, selectedDailyIds)
        if (avgResult.success) {
          studentSubjectAverages.push({
            studentId: student.id,
            average: avgResult.data,
          })
        }
      }

      // Sort by average descending and assign ranks
      studentSubjectAverages.sort((a, b) => b.average - a.average)
      studentSubjectAverages.forEach((item, index) => {
        subjectRankMap.set(item.studentId, index + 1)
      })

      // Assign ranks to student data
      for (const studentData of studentGradeData) {
        const subjectData = studentData.subjects.find((s) => s.subjectId === subjectId)
        if (subjectData) {
          subjectData.rank = subjectRankMap.get(studentData.studentId) || 0
          subjectData.totalStudents = students.length
        }
      }
    }

    // Calculate class rank based on general average
    const studentGeneralAverages = studentGradeData.map((s) => ({
      studentId: s.studentId,
      average: s.generalAverage,
    }))
    studentGeneralAverages.sort((a, b) => b.average - a.average)
    const classRankMap = new Map<string, number>()
    studentGeneralAverages.forEach((item, index) => {
      classRankMap.set(item.studentId, index + 1)
    })

    // Calculate total notes, total coefficients, and appreciation for each student
    for (const studentData of studentGradeData) {
      const subjectAverages = studentData.subjects.map((s) => ({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        coefficient: s.coefficient,
        average: s.weightedAverage,
      }))
      studentData.totalNotes = calculateTotalNotes(subjectAverages)
      studentData.totalCoefficients = calculateTotalCoefficients(subjectAverages)
      studentData.appreciation = calculateAppreciation(studentData.generalAverage)
      studentData.classRank = classRankMap.get(studentData.studentId) || 0
    }

    return {
      success: true,
      data: {
        className,
        periodName: period.name,
        schoolYear: period.schoolYear,
        examWeight: period.examWeight,
        dailyWeight: period.dailyWeight,
        students: studentGradeData,
      },
    }
  } catch (error: any) {
    console.error("Error getting class grades:", error)
    return { success: false, error: "Erreur lors du chargement des notes de la classe" }
  }
}
