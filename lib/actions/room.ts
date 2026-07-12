"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { roomSchema, type RoomInput } from "@/lib/validations/room"
import type { ActionResult } from "@/lib/utils"

type RoomWithRelations = {
  id: string
  name: string
  schoolId: string
}

export async function listRooms(): Promise<ActionResult<RoomWithRelations[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "view", "room", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const rooms = await prisma.room.findMany({
      where: {
        schoolId: session.user.schoolId,
      },
      orderBy: {
        name: "asc",
      },
    })

    return { success: true, data: rooms }
  } catch (error: any) {
    console.error("Error listing rooms:", error)
    return { success: false, error: "Erreur lors du chargement des salles" }
  }
}

export async function createRoom(data: RoomInput): Promise<ActionResult<RoomWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "create", "room", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = roomSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    // Check if room already exists (unique constraint)
    const existing = await prisma.room.findUnique({
      where: {
        name_schoolId: {
          name: validation.data.name,
          schoolId: session.user.schoolId,
        },
      },
    })

    if (existing) {
      return { success: false, error: "A room with this name already exists" }
    }

    const room = await prisma.room.create({
      data: {
        name: validation.data.name,
        schoolId: session.user.schoolId,
      },
    })

    return { success: true, data: room }
  } catch (error: any) {
    console.error("Error creating room:", error)
    if (error.code === 'P2002') {
      return { success: false, error: "Une salle avec ce nom existe déjà" }
    }
    return { success: false, error: "Erreur lors de la création de la salle" }
  }
}

export async function deleteRoom(id: string): Promise<ActionResult<void>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "delete", "room", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const room = await prisma.room.findUnique({
      where: { id },
    })

    if (!room) {
      return { success: false, error: "Room not found" }
    }

    if (room.schoolId !== session.user.schoolId) {
      return { success: false, error: "Forbidden" }
    }

    await prisma.room.delete({
      where: { id },
    })

    return { success: true, data: undefined }
  } catch (error: any) {
    console.error("Error deleting room:", error)
    return { success: false, error: "Erreur lors de la suppression de la salle" }
  }
}
