"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { classroomSchema, classroomUpdateSchema, type ClassroomInput, type ClassroomUpdateInput } from "@/lib/validations/classroom"
import type { ActionResult } from "@/lib/utils"

export async function getSchoolGrades(): Promise<ActionResult<Array<{ id: string; name: string; cycle: string; hasTracks: boolean }>>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const schoolGrades = await prisma.schoolGrade.findMany({
      where: {
        schoolId: session.user.schoolId,
      },
      include: {
        _count: {
          select: {
            tracks: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    })

    const result = schoolGrades.map((sg: any) => ({
      id: sg.id,
      name: sg.name,
      cycle: sg.cycle,
      hasTracks: sg._count.tracks > 0,
    }))

    return { success: true, data: result }
  } catch (error: any) {
    console.error("Error fetching school grades:", error)
    return { success: false, error: "Erreur lors du chargement des niveaux scolaires" }
  }
}

export async function getTracks(schoolGradeId: string): Promise<ActionResult<Array<{ id: string; name: string }>>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const tracks = await prisma.track.findMany({
      where: {
        schoolGradeId,
        schoolId: session.user.schoolId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return { success: true, data: tracks }
  } catch (error: any) {
    console.error("Error fetching tracks:", error)
    return { success: false, error: "Erreur lors du chargement des filières" }
  }
}

type ClassroomWithRelations = {
  id: string
  section: string
  schoolYear: string
  passingThreshold: number
  schoolGradeId: string
  trackId: string | null
  schoolGrade: {
    id: string
    name: string
    cycle: string
  }
  track: {
    id: string
    name: string
  } | null
  _count: {
    students: number
  }
}

export async function getClassroomById(id: string): Promise<ActionResult<ClassroomWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        schoolGrade: {
          select: {
            id: true,
            name: true,
            cycle: true,
          },
        },
        track: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    })

    if (!classroom) {
      return { success: false, error: "Classroom not found" }
    }

    if (classroom.schoolId !== session.user.schoolId) {
      return { success: false, error: "Forbidden" }
    }

    return { success: true, data: classroom }
  } catch (error: any) {
    console.error("Error getting classroom by id:", error)
    return { success: false, error: "Erreur lors de la récupération de la classe" }
  }
}

export async function listClassrooms(opts?: { search?: string; page?: number; pageSize?: number }): Promise<ActionResult<ClassroomWithRelations[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "view", "classroom", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const search = opts?.search?.trim()
    const page = opts?.page && opts.page > 0 ? opts.page : 1
    const pageSize = opts?.pageSize && opts.pageSize > 0 ? opts.pageSize : 20

    const where: any = { schoolId: session.user.schoolId }

    if (search) {
      where.OR = [
        { section: { contains: search, mode: "insensitive" } },
        { schoolYear: { contains: search, mode: "insensitive" } },
      ]
    }

    const classrooms = await prisma.classroom.findMany({
      where,
      include: {
        schoolGrade: {
          select: {
            id: true,
            name: true,
            cycle: true,
          },
        },
        track: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: [
        { schoolGrade: { order: "asc" } },
        { section: "asc" },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return { success: true, data: classrooms }
  } catch (error: any) {
    console.error("Error listing classrooms:", error)
    return { success: false, error: "Erreur lors du chargement des classes" }
  }
}

export async function createClassroom(data: ClassroomInput): Promise<ActionResult<ClassroomWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "create", "classroom", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = classroomSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    // Verify schoolGrade belongs to the school
    const schoolGrade = await prisma.schoolGrade.findUnique({
      where: { id: data.schoolGradeId },
    })

    if (!schoolGrade || schoolGrade.schoolId !== session.user.schoolId) {
      return { success: false, error: "Invalid school grade" }
    }

    // If trackId is provided, verify it belongs to the school and schoolGrade
    if (data.trackId) {
      const track = await prisma.track.findUnique({
        where: { id: data.trackId },
      })

      if (!track || track.schoolId !== session.user.schoolId || track.schoolGradeId !== data.schoolGradeId) {
        return { success: false, error: "Invalid track" }
      }
    }

    // Check if classroom already exists (unique constraint)
    const existing = await prisma.classroom.findUnique({
      where: {
        schoolGradeId_trackId_section_schoolYear: {
          schoolGradeId: data.schoolGradeId,
          trackId: data.trackId ?? null,
          section: data.section,
          schoolYear: data.schoolYear,
        },
      },
    } as any)

    if (existing) {
      return { success: false, error: "A classroom with this configuration already exists" }
    }

    const classroom = await prisma.classroom.create({
      data: {
        schoolGradeId: data.schoolGradeId,
        trackId: data.trackId,
        section: data.section,
        schoolYear: data.schoolYear,
        passingThreshold: data.passingThreshold,
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
        track: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    })

    return { success: true, data: classroom }
  } catch (error: any) {
    console.error("Error creating classroom:", error)
    if (error.code === 'P2002') {
      return { success: false, error: "Une classe avec cette section existe déjà pour ce niveau" }
    }
    return { success: false, error: "Erreur lors de la création de la classe" }
  }
}

export async function updateClassroom(id: string, data: ClassroomUpdateInput): Promise<ActionResult<ClassroomWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "update", "classroom", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = classroomUpdateSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    // Verify classroom belongs to the school
    const existingClassroom = await prisma.classroom.findUnique({
      where: { id },
    })

    if (!existingClassroom || existingClassroom.schoolId !== session.user.schoolId) {
      return { success: false, error: "Classroom not found" }
    }

    // If schoolGradeId is being updated, verify it belongs to the school
    if (data.schoolGradeId) {
      const schoolGrade = await prisma.schoolGrade.findUnique({
        where: { id: data.schoolGradeId },
      })

      if (!schoolGrade || schoolGrade.schoolId !== session.user.schoolId) {
        return { success: false, error: "Invalid school grade" }
      }
    }

    // If trackId is being updated, verify it belongs to the school and schoolGrade
    if (data.trackId) {
      const track = await prisma.track.findUnique({
        where: { id: data.trackId },
      })

      if (!track || track.schoolId !== session.user.schoolId) {
        return { success: false, error: "Invalid track" }
      }

      // If schoolGradeId is also being updated, verify track belongs to the new schoolGrace
      if (data.schoolGradeId && track.schoolGradeId !== data.schoolGradeId) {
        return { success: false, error: "Track does not belong to the specified school grade" }
      }

      // If schoolGradeId is not being updated, verify track belongs to the existing schoolGrade
      if (!data.schoolGradeId && track.schoolGradeId !== existingClassroom.schoolGradeId) {
        return { success: false, error: "Track does not belong to the classroom's school grade" }
      }
    }

    const classroom = await prisma.classroom.update({
      where: { id },
      data: validation.data,
      include: {
        schoolGrade: {
          select: {
            id: true,
            name: true,
            cycle: true,
          },
        },
        track: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    })

    return { success: true, data: classroom }
  } catch (error: any) {
    console.error("Error updating classroom:", error)
    if (error.code === 'P2002') {
      return { success: false, error: "Une classe avec cette section existe déjà pour ce niveau" }
    }
    return { success: false, error: "Erreur lors de la mise à jour de la classe" }
  }
}

export async function deleteClassroom(id: string): Promise<ActionResult<void>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "delete", "classroom", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    // Verify classroom belongs to the school
    const classroom = await prisma.classroom.findUnique({
      where: { id },
    })

    if (!classroom || classroom.schoolId !== session.user.schoolId) {
      return { success: false, error: "Classroom not found" }
    }

    await prisma.classroom.delete({
      where: { id },
    })

    return { success: true, data: undefined }
  } catch (error: any) {
    console.error("Error deleting classroom:", error)
    return { success: false, error: "Erreur lors de la suppression de la classe" }
  }
}
