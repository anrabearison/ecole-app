"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { teacherSchema, teacherUpdateSchema, type TeacherInput, type TeacherUpdateInput } from "@/lib/validations/teacher"
import type { ActionResult } from "@/lib/utils"
import bcrypt from "bcryptjs"

type TeacherWithRelations = {
  id: string
  firstName: string
  lastName: string
  user: {
    id: string
    email: string
    active: boolean
  }
  schoolId: string
  _count: {
    subjects: number
  }
  createdAt: Date
}

type TeacherCreateResult = {
  teacher: TeacherWithRelations
  temporaryPassword: string
}

export async function getTeacherById(id: string): Promise<ActionResult<TeacherWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "view", "teacher", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            active: true,
          },
        },
        _count: {
          select: {
            subjects: true,
          },
        },
      },
    })

    if (!teacher) {
      return { success: false, error: "Teacher not found" }
    }

    if (teacher.schoolId !== session.user.schoolId) {
      return { success: false, error: "Forbidden" }
    }

    return { success: true, data: teacher }
  } catch (error) {
    console.error("Error getting teacher by id:", error)
    return { success: false, error: "Failed to get teacher" }
  }
}

export async function listTeachers(): Promise<ActionResult<TeacherWithRelations[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "view", "teacher", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const teachers = await prisma.teacher.findMany({
      where: {
        schoolId: session.user.schoolId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            active: true,
          },
        },
        _count: {
          select: {
            subjects: true,
          },
        },
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    })

    return { success: true, data: teachers }
  } catch (error) {
    console.error("Error listing teachers:", error)
    return { success: false, error: "Failed to list teachers" }
  }
}

export async function createTeacher(data: TeacherInput): Promise<ActionResult<TeacherCreateResult>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "create", "teacher", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = teacherSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return { success: false, error: "Email already exists" }
    }

    // Generate temporary password (8 characters)
    const tempPassword = Math.random().toString(36).slice(-8)
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    // Create User and Teacher in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "TEACHER",
          schoolId: session.user.schoolId,
          active: true,
        },
      })

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          schoolId: session.user.schoolId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              active: true,
            },
          },
          _count: {
            select: {
              subjects: true,
            },
          },
        },
      })

      return teacher
    })

    // Return the temporary password once in the response for display to the admin
    // The password is never stored in clear text or logged
    return { success: true, data: { teacher: result, temporaryPassword: tempPassword } }
  } catch (error) {
    console.error("Error creating teacher:", error)
    return { success: false, error: "Failed to create teacher" }
  }
}

export async function updateTeacher(id: string, data: TeacherUpdateInput): Promise<ActionResult<TeacherWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "update", "teacher", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = teacherUpdateSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    // Verify teacher belongs to the school
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id },
    })

    if (!existingTeacher || existingTeacher.schoolId !== session.user.schoolId) {
      return { success: false, error: "Teacher not found" }
    }

    // If email is being updated, check if it's already taken by another user
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (existingUser && existingUser.id !== existingTeacher.userId) {
        return { success: false, error: "Email already exists" }
      }
    }

    // Update in transaction to handle user email update if needed
    const result = await prisma.$transaction(async (tx: any) => {
      // Update user email if provided
      if (data.email) {
        await tx.user.update({
          where: { id: existingTeacher.userId },
          data: { email: data.email },
        })
      }

      // Update teacher
      const teacher = await tx.teacher.update({
        where: { id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              active: true,
            },
          },
          _count: {
            select: {
              subjects: true,
            },
          },
        },
      })

      return teacher
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Error updating teacher:", error)
    return { success: false, error: "Failed to update teacher" }
  }
}

export async function deleteTeacher(id: string): Promise<ActionResult<void>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "delete", "teacher", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    // Verify teacher belongs to the school
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })

    if (!teacher || teacher.schoolId !== session.user.schoolId) {
      return { success: false, error: "Teacher not found" }
    }

    // Deactivate the user account instead of deleting
    await prisma.user.update({
      where: { id: teacher.userId },
      data: { active: false },
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error deleting teacher:", error)
    return { success: false, error: "Failed to delete teacher" }
  }
}
