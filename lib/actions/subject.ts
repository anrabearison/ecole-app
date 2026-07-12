"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { subjectSchema, type SubjectInput } from "@/lib/validations/subject"
import type { ActionResult } from "@/lib/utils"

export async function listSubjects(): Promise<ActionResult<Array<{ id: string; name: string }>>> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Non autorisé" }
    }

    if (!can(session.user.role, "view", "subject")) {
      return { success: false, error: "Non autorisé" }
    }

    const subjects = await prisma.subject.findMany({
      where: {
        schoolId: session.user.schoolId,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    })

    return { success: true, data: subjects }
  } catch (error) {
    console.error("Error listing subjects:", error)
    return { success: false, error: "Erreur lors de la récupération des matières" }
  }
}

export async function createSubject(data: SubjectInput): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Non autorisé" }
    }

    if (!can(session.user.role, "create", "subject")) {
      return { success: false, error: "Non autorisé" }
    }

    const parsed = subjectSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: "Données invalides" }
    }

    // Check if subject with same name already exists in the school
    const existing = await prisma.subject.findFirst({
      where: {
        schoolId: session.user.schoolId,
        name: parsed.data.name,
      },
    })

    if (existing) {
      return { success: false, error: "Une matière avec ce nom existe déjà" }
    }

    const subject = await prisma.subject.create({
      data: {
        name: parsed.data.name,
        coefficient: parsed.data.coefficient,
        schoolId: session.user.schoolId,
      },
    })

    return { success: true, data: subject }
  } catch (error) {
    console.error("Error creating subject:", error)
    return { success: false, error: "Erreur lors de la création de la matière" }
  }
}

export async function updateSubject(id: string, data: SubjectInput): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Non autorisé" }
    }

    if (!can(session.user.role, "update", "subject")) {
      return { success: false, error: "Non autorisé" }
    }

    const parsed = subjectSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: "Données invalides" }
    }

    // Ensure subject belongs to user's school
    const existing = await prisma.subject.findUnique({
      where: { id },
    })

    if (!existing || existing.schoolId !== session.user.schoolId) {
      return { success: false, error: "Matière non trouvée" }
    }

    // Check if another subject has the same name
    const duplicate = await prisma.subject.findFirst({
      where: {
        schoolId: session.user.schoolId,
        name: parsed.data.name,
        id: { not: id },
      },
    })

    if (duplicate) {
      return { success: false, error: "Une matière avec ce nom existe déjà" }
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        name: parsed.data.name,
        coefficient: parsed.data.coefficient,
      },
    })

    return { success: true, data: subject }
  } catch (error) {
    console.error("Error updating subject:", error)
    return { success: false, error: "Erreur lors de la mise à jour de la matière" }
  }
}

export async function deleteSubject(id: string): Promise<ActionResult<void>> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Non autorisé" }
    }

    if (!can(session.user.role, "delete", "subject")) {
      return { success: false, error: "Non autorisé" }
    }

    // Ensure subject belongs to user's school
    const subject = await prisma.subject.findUnique({
      where: { id },
    })

    if (!subject || subject.schoolId !== session.user.schoolId) {
      return { success: false, error: "Matière non trouvée" }
    }

    await prisma.subject.delete({
      where: { id },
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error deleting subject:", error)
    return { success: false, error: "Erreur lors de la suppression de la matière" }
  }
}
