"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { teacherSchema, teacherUpdateSchema, type TeacherInput, type TeacherUpdateInput } from "@/lib/validations/teacher"
import type { ActionResult, PaginatedActionResult } from "@/lib/utils"
import bcrypt from "bcryptjs"

type TeacherWithRelations = {
  id: string
  firstName: string | null
  lastName: string
  phone: string | null
  contractType: string | null
  registrationNumber: string | null
  nationalIdNumber: string
  sex: string | null
  user: {
    id: string
    email: string | null
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

export async function listTeachers(opts?: { search?: string; page?: number; pageSize?: number; active?: boolean }): Promise<PaginatedActionResult<TeacherWithRelations[]>> {
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
    const search = opts?.search?.trim()
    const page = opts?.page && opts.page > 0 ? opts.page : 1
    const pageSize = opts?.pageSize && opts.pageSize > 0 ? opts.pageSize : 20
    const active = opts?.active

    const where: any = { schoolId: session.user.schoolId }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { nationalIdNumber: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ]
    }

    if (active !== undefined) {
      if (where.user) {
        where.user.active = active
      } else {
        where.user = { active }
      }
    }

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
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
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.teacher.count({ where })
    ])

    const totalPages = Math.ceil(total / pageSize)

    return { 
      success: true, 
      data: teachers,
      pagination: {
        total,
        page,
        pageSize,
        totalPages
      }
    }
  } catch (error: any) {
    console.error("Error listing teachers:", error)
    return { success: false, error: "Erreur lors du chargement des enseignants" }
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

  const cleanEmail = data.email && data.email.trim() !== "" ? data.email.trim() : undefined
  const cleanFirstName = data.firstName && data.firstName.trim() !== "" ? data.firstName.trim() : null

  try {
    // Check if email already exists (only if email is provided)
    if (cleanEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      })

      if (existingUser) {
        return { success: false, error: "Cet email est déjà utilisé par un autre compte" }
      }
    }

    // Use default temporary password
    const tempPassword = "Init12345"
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    // Create User and Teacher in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail || null,
          passwordHash,
          role: "TEACHER",
          school: { connect: { id: session.user.schoolId! } },
          active: true,
        },
      })

      const teacher = await tx.teacher.create({
        data: {
          user: {
            connect: {
              id: user.id,
            },
          },
          firstName: cleanFirstName,
          lastName: data.lastName,
          phone: data.phone,
          contractType: data.contractType,
          registrationNumber: data.registrationNumber,
          nationalIdNumber: data.nationalIdNumber,
          sex: data.sex,
          school: { connect: { id: session.user.schoolId! } },
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
  } catch (error: any) {
    console.error("Error creating teacher:", error)
    if (error?.code === "P2002") {
      const field = error?.meta?.target?.[0]
      if (field === "nationalIdNumber") return { success: false, error: "Ce numéro CIN est déjà utilisé." }
      if (field === "email") return { success: false, error: "Cette adresse email est déjà utilisée." }
      return { success: false, error: "Une contrainte d'unicité a été violée." }
    }
    return { success: false, error: error?.message ?? "Erreur lors de la création de l'enseignant" }
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

  const cleanEmail = data.email && data.email.trim() !== "" ? data.email.trim() : undefined
  const cleanFirstName = data.firstName !== undefined ? (data.firstName && data.firstName.trim() !== "" ? data.firstName.trim() : null) : undefined

  try {
    // Verify teacher belongs to the school
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id },
    })

    if (!existingTeacher || existingTeacher.schoolId !== session.user.schoolId) {
      return { success: false, error: "Teacher not found" }
    }

    // If email is being updated, check if it's already taken by another user
    if (cleanEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      })

      if (existingUser && existingUser.id !== existingTeacher.userId) {
        return { success: false, error: "Email already exists" }
      }
    }

    // Update in transaction to handle user email update if needed
    const result = await prisma.$transaction(async (tx: any) => {
      // Update user email if provided (or set to null if empty)
      if (data.email !== undefined) {
        await tx.user.update({
          where: { id: existingTeacher.userId },
          data: { email: cleanEmail || null },
        })
      }

      // Update teacher
      const teacher = await tx.teacher.update({
        where: { id },
        data: {
          firstName: cleanFirstName !== undefined ? cleanFirstName : existingTeacher.firstName,
          lastName: data.lastName,
          phone: data.phone,
          contractType: data.contractType,
          registrationNumber: data.registrationNumber,
          nationalIdNumber: data.nationalIdNumber,
          sex: data.sex,
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
  } catch (error: any) {
    console.error("Error updating teacher:", error)
    return { success: false, error: "Erreur lors de la mise à jour de l'enseignant" }
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
  } catch (error: any) {
    console.error("Error deleting teacher:", error)
    return { success: false, error: "Erreur lors de la suppression de l'enseignant" }
  }
}
