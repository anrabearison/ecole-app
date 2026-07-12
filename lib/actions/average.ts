"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/lib/utils"

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

/**
 * Calculate subject average for a student in a period
 * Weighted average based on School.examWeight/dailyWeight
 */
export async function calculateSubjectAverage(
  studentId: string,
  subjectId: string,
  periodId: string
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
    // Get school weighting configuration
    const school = await prisma.school.findUnique({
      where: { id: session.user.schoolId },
      select: { examWeight: true, dailyWeight: true },
    })

    if (!school) {
      return { success: false, error: "School not found" }
    }

    // Get all grades for this student, subject, and period
    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        subjectId,
        periodId,
        schoolId: session.user.schoolId,
      },
      select: { type: true, value: true },
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
      if (grade.type === "EXAM") {
        examSum += grade.value
        examCount++
      } else {
        dailySum += grade.value
        dailyCount++
      }
    }

    const examAvg = examCount > 0 ? examSum / examCount : 0
    const dailyAvg = dailyCount > 0 ? dailySum / dailyCount : 0

    // Weighted average
    const average = examAvg * school.examWeight + dailyAvg * school.dailyWeight

    return { success: true, data: average }
  } catch (error) {
    console.error("Error calculating subject average:", error)
    return { success: false, error: "Failed to calculate subject average" }
  }
}

/**
 * Calculate general average for a student in a period
 * Weighted by subject coefficients
 */
export async function calculateGeneralAverage(
  studentId: string,
  periodId: string
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
    // Get all subjects with grades for this student in this period
    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        periodId,
        schoolId: session.user.schoolId,
      },
      include: {
        subject: {
          select: { id: true, name: true, coefficient: true },
        },
      },
    })

    if (grades.length === 0) {
      return { success: true, data: 0 }
    }

    // Group by subject and calculate each subject average
    const subjectAverages = new Map<string, { average: number; coefficient: number }>()
    
    for (const grade of grades) {
      const subjectId = grade.subject.id
      if (!subjectAverages.has(subjectId)) {
        subjectAverages.set(subjectId, { average: 0, coefficient: grade.subject.coefficient })
      }
    }

    // Calculate each subject average
    for (const [subjectId, data] of subjectAverages) {
      const subjectAvgResult = await calculateSubjectAverage(studentId!, subjectId, periodId)
      if (subjectAvgResult.success) {
        data.average = subjectAvgResult.data
      }
    }

    // Calculate weighted general average
    let weightedSum = 0
    let totalCoefficient = 0

    for (const data of subjectAverages.values()) {
      weightedSum += data.average * data.coefficient
      totalCoefficient += data.coefficient
    }

    const average = totalCoefficient > 0 ? weightedSum / totalCoefficient : 0

    return { success: true, data: average }
  } catch (error) {
    console.error("Error calculating general average:", error)
    return { success: false, error: "Failed to calculate general average" }
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

    // Calculate general average for each student
    const studentAverages: Array<{ studentId: string; average: number }> = []

    for (const student of students) {
      const avgResult = await calculateGeneralAverage(student.id, periodId)
      if (avgResult.success) {
        studentAverages.push({
          studentId: student.id,
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
    return { success: false, error: "Failed to calculate class rank" }
  }
}

/**
 * Get all subject averages for a student in a period
 */
export async function getStudentSubjectAverages(
  studentId: string,
  periodId: string
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
    // Get all subjects with grades for this student in this period
    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        periodId,
        schoolId: session.user.schoolId,
      },
      include: {
        subject: {
          select: { id: true, name: true, coefficient: true },
        },
      },
    })

    if (grades.length === 0) {
      return { success: true, data: [] }
    }

    // Get unique subjects
    const uniqueSubjects = Array.from(
      new Map(grades.map((g) => [g.subject.id, g.subject])).values()
    )

    // Calculate average for each subject
    const subjectAverages: SubjectAverage[] = []

    for (const subject of uniqueSubjects) {
      const avgResult = await calculateSubjectAverage(studentId, subject.id, periodId)
      if (avgResult.success) {
        subjectAverages.push({
          subjectId: subject.id,
          subjectName: subject.name,
          coefficient: subject.coefficient,
          average: avgResult.data,
        })
      }
    }

    return { success: true, data: subjectAverages }
  } catch (error) {
    console.error("Error getting student subject averages:", error)
    return { success: false, error: "Failed to get student subject averages" }
  }
}
