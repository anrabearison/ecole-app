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
  } catch (error) {
    console.error("Error fetching school grades:", error)
    return { success: false, error: "Failed to fetch school grades" }
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
  } catch (error) {
    console.error("Error fetching tracks:", error)
    return { success: false, error: "Failed to fetch tracks" }
  }
}

type ClassroomWithRelations = {
  id: string
  section: string
  schoolYear: string
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

export async function listClassrooms(): Promise<ActionResult<ClassroomWithRelations[]>> {
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
    const classrooms = await prisma.classroom.findMany({
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
    })

    return { success: true, data: classrooms }
  } catch (error) {
    console.error("Error listing classrooms:", error)
    return { success: false, error: "Failed to list classrooms" }
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

    const classroom = await prisma.classroom.create({
      data: {
        schoolGradeId: data.schoolGradeId,
        trackId: data.trackId,
        section: data.section,
        schoolYear: data.schoolYear,
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
  } catch (error) {
    console.error("Error creating classroom:", error)
    return { success: false, error: "Failed to create classroom" }
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
  } catch (error) {
    console.error("Error updating classroom:", error)
    return { success: false, error: "Failed to update classroom" }
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
  } catch (error) {
    console.error("Error deleting classroom:", error)
    return { success: false, error: "Failed to delete classroom" }
  }
}
