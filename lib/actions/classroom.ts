"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { classroomSchema, classroomUpdateSchema, type ClassroomInput, type ClassroomUpdateInput } from "@/lib/validations/classroom"
import type { ActionResult, PaginatedActionResult } from "@/lib/utils"

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
  homeroomTeachers: Array<{
    id: string
    isPrimary: boolean
    teacher: {
      id: string
      firstName: string
      lastName: string
    }
  }>
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
        homeroomTeachers: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            isPrimary: 'desc', // Primary teachers first
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

export async function listClassrooms(opts?: { search?: string; page?: number; pageSize?: number }): Promise<PaginatedActionResult<ClassroomWithRelations[]>> {
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

    const [classrooms, total] = await Promise.all([
      prisma.classroom.findMany({
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
          homeroomTeachers: {
            include: {
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              isPrimary: 'desc',
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
      }),
      prisma.classroom.count({ where })
    ])

    const totalPages = Math.ceil(total / pageSize)

    return { 
      success: true, 
      data: classrooms,
      pagination: {
        total,
        page,
        pageSize,
        totalPages
      }
    }
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
    // Normalize trackId: convert empty string or "$undefined" to null
    const normalizedTrackId = (!data.trackId || data.trackId === "" || data.trackId === "$undefined") ? null : data.trackId

    // Verify schoolGrade belongs to the school
    const schoolGrade = await prisma.schoolGrade.findUnique({
      where: { id: data.schoolGradeId },
    })

    if (!schoolGrade || schoolGrade.schoolId !== session.user.schoolId) {
      return { success: false, error: "Invalid school grade" }
    }

    // If trackId is provided, verify it belongs to the school and schoolGrade
    if (normalizedTrackId) {
      const track = await prisma.track.findUnique({
        where: { id: normalizedTrackId },
      })

      if (!track || track.schoolId !== session.user.schoolId || track.schoolGradeId !== data.schoolGradeId) {
        return { success: false, error: "Invalid track" }
      }
    }

    // If homeroomTeacherIds are provided, verify they belong to the same school
    if (data.homeroomTeacherIds && data.homeroomTeacherIds.length > 0) {
      const teachers = await prisma.teacher.findMany({
        where: {
          id: { in: data.homeroomTeacherIds },
          schoolId: session.user.schoolId,
        },
      })

      if (teachers.length !== data.homeroomTeacherIds.length) {
        return { success: false, error: "Un ou plusieurs enseignants sélectionnés n'appartiennent pas à cette école" }
      }
    }

    // Check if classroom already exists (unique constraint)
    const existing = await prisma.classroom.findFirst({
      where: {
        schoolGradeId: data.schoolGradeId,
        section: data.section,
        schoolYear: data.schoolYear,
        trackId: normalizedTrackId,
      },
    })

    if (existing) {
      return { success: false, error: "A classroom with this configuration already exists" }
    }

    const classroom = await prisma.classroom.create({
      data: {
        schoolGradeId: data.schoolGradeId,
        trackId: normalizedTrackId,
        section: data.section,
        schoolYear: data.schoolYear,
        passingThreshold: data.passingThreshold,
        schoolId: session.user.schoolId!,
        homeroomTeachers: data.homeroomTeacherIds && data.homeroomTeacherIds.length > 0
          ? {
              create: data.homeroomTeacherIds.map((teacherId, index) => ({
                teacher: { connect: { id: teacherId } },
                school: { connect: { id: session.user.schoolId! } },
                isPrimary: index === 0, // First teacher is primary
              })),
            }
          : undefined,
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
        homeroomTeachers: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            isPrimary: 'desc',
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

    // If homeroomTeacherIds are being updated, verify they belong to the same school
    if (data.homeroomTeacherIds !== undefined) {
      if (data.homeroomTeacherIds.length > 0) {
        const teachers = await prisma.teacher.findMany({
          where: {
            id: { in: data.homeroomTeacherIds },
            schoolId: session.user.schoolId,
          },
        })

        if (teachers.length !== data.homeroomTeacherIds.length) {
          return { success: false, error: "Un ou plusieurs enseignants sélectionnés n'appartiennent pas à cette école" }
        }
      }
    }

    // Use transaction to ensure all operations succeed or fail together
    const classroom = await prisma.$transaction(async (tx) => {
      // If homeroomTeacherIds are being updated, handle them first
      if (data.homeroomTeacherIds !== undefined) {
        // Delete existing homeroom teachers
        await tx.classroomHomeroomTeacher.deleteMany({
          where: { classroomId: id },
        })

        // Create new homeroom teachers if provided
        if (data.homeroomTeacherIds.length > 0) {
          await tx.classroomHomeroomTeacher.createMany({
            data: data.homeroomTeacherIds.map((teacherId, index) => ({
              classroomId: id,
              teacherId,
              schoolId: session.user.schoolId!,
              isPrimary: index === 0,
            })),
          })
        }
      }

      // Update classroom basic fields
      // Only include fields that are actually updateable (exclude homeroomTeacherIds)
      const { homeroomTeacherIds, ...updateData } = validation.data

      await tx.classroom.update({
        where: { id },
        data: updateData,
      })

      // Re-fetch with includes to get updated homeroomTeachers
      const updatedClassroom = await tx.classroom.findUnique({
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
          homeroomTeachers: {
            include: {
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              isPrimary: 'desc',
            },
          },
          _count: {
            select: {
              students: true,
            },
          },
        },
      })

      if (!updatedClassroom) {
        throw new Error("Classroom not found after update")
      }

      return updatedClassroom
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
