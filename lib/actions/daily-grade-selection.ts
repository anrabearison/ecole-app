"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/lib/utils"

export type DailyAssessmentOption = {
  assessmentId: string
  date: string       // ISO date string
  dateLabel: string  // formatted for display
  title: string | null
  selected: boolean
}

export type DailyGradeSelectionResult = {
  subjectId: string
  subjectName: string
  assessments: DailyAssessmentOption[]
}

/**
 * List all DAILY assessments for a teacher's subject in a classroom + period,
 * with a flag indicating which ones are currently selected.
 * Only the teacher assigned to the subject in the classroom can call this.
 */
export async function listDailyAssessmentsWithSelection(
  classroomId: string,
  subjectId: string,
  periodId: string,
): Promise<ActionResult<DailyGradeSelectionResult>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.teacherId) {
    return { success: false, error: "Teacher ID is required" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  if (!can(session.user.role, "view", "grade", { teacherId: session.user.teacherId, schoolId: session.user.schoolId })) {
    return { success: false, error: "Forbidden" }
  }

  // Verify teacher is assigned to this subject in this classroom
  const teacherSubject = await prisma.teacherSubject.findUnique({
    where: {
      teacherId_subjectId_classroomId: {
        teacherId: session.user.teacherId,
        subjectId,
        classroomId,
      },
    },
    include: {
      subject: { select: { id: true, name: true } },
    },
  })

  if (!teacherSubject) {
    return { success: false, error: "Vous n'enseignez pas cette matière dans cette classe" }
  }

  try {
    // Get all DAILY assessments for this teacher/classroom/subject/period
    const assessments = await prisma.assessment.findMany({
      where: {
        schoolId: session.user.schoolId,
        teacherId: session.user.teacherId,
        classroomId,
        subjectId,
        periodId,
        type: "DAILY",
      },
      orderBy: { date: "asc" },
      select: { id: true, date: true, title: true },
    })

    // Get currently selected assessment IDs for this combination
    const selections = await prisma.dailyGradeSelection.findMany({
      where: {
        schoolId: session.user.schoolId,
        teacherId: session.user.teacherId,
        classroomId,
        subjectId,
        periodId,
      },
      select: { assessmentId: true },
    })

    const hasSavedSelection = selections.length > 0
    const selectedIds = new Set(selections.map((s: { assessmentId: string }) => s.assessmentId))

    const result: DailyGradeSelectionResult = {
      subjectId: teacherSubject.subject.id,
      subjectName: teacherSubject.subject.name,
      assessments: assessments.map((a) => ({
        assessmentId: a.id,
        date: a.date.toISOString().split("T")[0],
        dateLabel: new Date(a.date).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        title: a.title,
        selected: hasSavedSelection ? selectedIds.has(a.id) : true,
      })),
    }

    return { success: true, data: result }
  } catch (error: any) {
    console.error("Error listing daily assessments with selection:", error)
    return { success: false, error: "Erreur lors du chargement des évaluations journalières" }
  }
}

/**
 * Save (replace) the daily grade selection for a teacher's subject in a classroom + period.
 * Only the teacher assigned to the subject can call this.
 * Replaces previous selection entirely (delete + recreate).
 */
export async function saveDailyGradeSelection(
  classroomId: string,
  subjectId: string,
  periodId: string,
  selectedAssessmentIds: string[],
): Promise<ActionResult<{ count: number }>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.teacherId) {
    return { success: false, error: "Teacher ID is required" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  if (!can(session.user.role, "create", "grade", { teacherId: session.user.teacherId, schoolId: session.user.schoolId })) {
    return { success: false, error: "Forbidden" }
  }

  // Verify teacher is assigned to this subject in this classroom
  const teacherSubject = await prisma.teacherSubject.findUnique({
    where: {
      teacherId_subjectId_classroomId: {
        teacherId: session.user.teacherId,
        subjectId,
        classroomId,
      },
    },
  })

  if (!teacherSubject) {
    return { success: false, error: "Vous n'enseignez pas cette matière dans cette classe" }
  }

  // Validate that all assessment IDs belong to this teacher/classroom/subject/period and are DAILY
  if (selectedAssessmentIds.length > 0) {
    const validCount = await prisma.assessment.count({
      where: {
        id: { in: selectedAssessmentIds },
        schoolId: session.user.schoolId,
        teacherId: session.user.teacherId,
        classroomId,
        subjectId,
        periodId,
        type: "DAILY",
      },
    })

    if (validCount !== selectedAssessmentIds.length) {
      return { success: false, error: "Certaines évaluations sélectionnées sont invalides" }
    }
  }

  try {
    // Replace selection atomically
    await prisma.$transaction([
      // Delete previous selection
      prisma.dailyGradeSelection.deleteMany({
        where: {
          schoolId: session.user.schoolId,
          teacherId: session.user.teacherId,
          classroomId,
          subjectId,
          periodId,
        },
      }),
      // Insert new selection
      ...(selectedAssessmentIds.length > 0
        ? [
            prisma.dailyGradeSelection.createMany({
              data: selectedAssessmentIds.map((assessmentId) => ({
                teacherId: session.user.teacherId!,
                classroomId,
                subjectId,
                periodId,
                assessmentId,
                schoolId: session.user.schoolId!,
              })),
            }),
          ]
        : []),
    ])

    return { success: true, data: { count: selectedAssessmentIds.length } }
  } catch (error: any) {
    console.error("Error saving daily grade selection:", error)
    return { success: false, error: "Erreur lors de l'enregistrement de la sélection" }
  }
}

/**
 * Get the selected daily assessment IDs for a specific classroom/subject/period combination.
 * Used by the average calculation engine at report card generation time.
 * Returns null if no selection was made (meaning: use all daily notes).
 */
export async function getSelectedDailyAssessmentIds(
  classroomId: string,
  subjectId: string,
  periodId: string,
  schoolId: string,
): Promise<string[] | null> {
  const selections = await prisma.dailyGradeSelection.findMany({
    where: { classroomId, subjectId, periodId, schoolId },
    select: { assessmentId: true },
  })

  // If no selection row exists, teacher never configured this → return null (use all)
  if (selections.length === 0) return null

  return selections.map((s: { assessmentId: string }) => s.assessmentId)
}
