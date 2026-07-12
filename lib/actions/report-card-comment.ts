"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { reportCardCommentSchema, type ReportCardCommentInput } from "@/lib/validations/report-card-comment"
import type { ActionResult } from "@/lib/utils"

export type ReportCardCommentWithRelations = {
  id: string
  comment: string
  studentId: string
  periodId: string
  schoolId: string
  createdAt: Date
}

/**
 * Create or update a report card comment for a student in a period
 * Upsert pattern: creates if doesn't exist, updates if does
 * SCHOOL_ADMIN/STAFF_ADMIN/TEACHER can create/update for any student in their school
 */
export async function upsertReportCardComment(data: ReportCardCommentInput): Promise<ActionResult<ReportCardCommentWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "L'identifiant de l'école est manquant" }
  }

  if (!can(session.user.role, "update", "student")) {
    return { success: false, error: "Forbidden" }
  }

  const validation = reportCardCommentSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    const comment = await prisma.reportCardComment.upsert({
      where: {
        studentId_periodId: {
          studentId: validation.data.studentId,
          periodId: validation.data.periodId,
        },
      },
      update: {
        comment: validation.data.comment,
      },
      create: {
        comment: validation.data.comment,
        studentId: validation.data.studentId,
        periodId: validation.data.periodId,
        schoolId: session.user.schoolId,
      },
    })

    return { success: true, data: comment as ReportCardCommentWithRelations }
  } catch (error: any) {
    console.error("Error upserting report card comment:", error)
    return { success: false, error: "Erreur lors de la mise à jour de l'appréciation" }
  }
}

/**
 * Get a report card comment for a student in a period
 */
export async function getReportCardComment(studentId: string, periodId: string): Promise<ActionResult<ReportCardCommentWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "L'identifiant de l'école est manquant" }
  }

  if (!can(session.user.role, "view", "student")) {
    return { success: false, error: "Forbidden" }
  }

  try {
    const comment = await prisma.reportCardComment.findUnique({
      where: {
        studentId_periodId: {
          studentId,
          periodId,
        },
      },
    })

    if (!comment) {
      return { success: true, data: null as any }
    }

    return { success: true, data: comment as ReportCardCommentWithRelations }
  } catch (error: any) {
    console.error("Error getting report card comment:", error)
    return { success: false, error: "Erreur lors du chargement de l'appréciation" }
  }
}
