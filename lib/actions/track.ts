"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { trackSchema, trackUpdateSchema, type TrackInput, type TrackUpdateInput } from "@/lib/validations/track"
import type { ActionResult } from "@/lib/utils"

type TrackWithRelations = {
  id: string
  name: string
  schoolGradeId: string
  schoolGrade: {
    id: string
    name: string
    cycle: string
  }
  schoolId: string
  classrooms: {
    id: string
    section: string
    schoolYear: string
  }[]
}

export async function listTracks(): Promise<ActionResult<TrackWithRelations[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "view", "track", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const tracks = await prisma.track.findMany({
      where: {
        schoolId: session.user.schoolId,
      },
      include: {
        schoolGrade: {
          select: {
            id: true,
            name: true,
            cycle: true,
          },
        },
        classrooms: {
          select: {
            id: true,
            section: true,
            schoolYear: true,
          },
        },
      },
      orderBy: {
        schoolGrade: {
          order: "asc",
        },
      },
    })

    return { success: true, data: tracks as TrackWithRelations[] }
  } catch (error: any) {
    console.error("Error listing tracks:", error)
    return { success: false, error: "Erreur lors du chargement des filières" }
  }
}

export async function createTrack(data: TrackInput): Promise<ActionResult<TrackWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "create", "track", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = trackSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    // Verify the schoolGrade belongs to the same school
    const schoolGrade = await prisma.schoolGrade.findUnique({
      where: { id: validation.data.schoolGradeId },
    })

    if (!schoolGrade || schoolGrade.schoolId !== session.user.schoolId) {
      return { success: false, error: "School grade not found or does not belong to your school" }
    }

    // Check if track already exists (unique constraint)
    const existing = await prisma.track.findUnique({
      where: {
        name_schoolGradeId: {
          name: validation.data.name,
          schoolGradeId: validation.data.schoolGradeId,
        },
      },
    })

    if (existing) {
      return { success: false, error: "A track with this name already exists for this school grade" }
    }

    const track = await prisma.track.create({
      data: {
        name: validation.data.name,
        schoolGradeId: validation.data.schoolGradeId,
        schoolId: session.user.schoolId,
      },
      include: {
        schoolGrade: {
          select: {
            id: true,
            name: true,
            cycle: true,
          },
        },
        classrooms: {
          select: {
            id: true,
            section: true,
            schoolYear: true,
          },
        },
      },
    })

    return { success: true, data: track as TrackWithRelations }
  } catch (error: any) {
    console.error("Error creating track:", error)
    if (error.code === 'P2002') {
      return { success: false, error: "Une filière avec ce nom existe déjà pour ce niveau" }
    }
    return { success: false, error: "Erreur lors de la création de la filière" }
  }
}

export async function updateTrack(id: string, data: TrackUpdateInput): Promise<ActionResult<TrackWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "update", "track", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = trackUpdateSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    // If schoolGradeId is being changed, verify it belongs to the same school
    if (validation.data.schoolGradeId) {
      const schoolGrade = await prisma.schoolGrade.findUnique({
        where: { id: validation.data.schoolGradeId },
      })

      if (!schoolGrade || schoolGrade.schoolId !== session.user.schoolId) {
        return { success: false, error: "School grade not found or does not belong to your school" }
      }
    }

    const track = await prisma.track.update({
      where: { id },
      data: {
        ...(validation.data.name !== undefined && { name: validation.data.name }),
        ...(validation.data.schoolGradeId !== undefined && { schoolGradeId: validation.data.schoolGradeId }),
      },
      include: {
        schoolGrade: {
          select: {
            id: true,
            name: true,
            cycle: true,
          },
        },
        classrooms: {
          select: {
            id: true,
            section: true,
            schoolYear: true,
          },
        },
      },
    })

    return { success: true, data: track as TrackWithRelations }
  } catch (error: any) {
    console.error("Error updating track:", error)
    if (error.code === 'P2002') {
      return { success: false, error: "Une filière avec ce nom existe déjà pour ce niveau" }
    }
    return { success: false, error: "Erreur lors de la mise à jour de la filière" }
  }
}

export async function deleteTrack(id: string): Promise<ActionResult<void>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "delete", "track", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    await prisma.track.delete({
      where: { id },
    })

    return { success: true, data: undefined }
  } catch (error: any) {
    console.error("Error deleting track:", error)
    return { success: false, error: "Erreur lors de la suppression de la filière" }
  }
}
