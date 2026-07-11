"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { schoolSchema, type SchoolInput } from "@/lib/validations/school"
import type { ActionResult } from "@/lib/utils"
import bcrypt from "bcryptjs"

export type SchoolWithStats = {
  id: string
  name: string
  address: string | null
  createdAt: Date
  studentCount: number
  teacherCount: number
  classroomCount: number
}

export type SchoolStats = {
  studentCount: number
  teacherCount: number
  classroomCount: number
}

/**
 * List all schools - PLATFORM_SUPER_ADMIN only
 * NOTE: No schoolId filter here - PLATFORM_SUPER_ADMIN sees all schools by design
 */
export async function listSchools(): Promise<ActionResult<SchoolWithStats[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "view", "school")) {
    return { success: false, error: "Forbidden" }
  }

  try {
    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: {
            students: { where: { user: { active: true } } },
            teachers: { where: { user: { active: true } } },
            classrooms: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    const schoolsWithStats: SchoolWithStats[] = schools.map((school: any) => ({
      id: school.id,
      name: school.name,
      address: school.address,
      createdAt: school.createdAt,
      studentCount: school._count.students,
      teacherCount: school._count.teachers,
      classroomCount: school._count.classrooms,
    }))

    return { success: true, data: schoolsWithStats }
  } catch (error) {
    console.error("Error listing schools:", error)
    return { success: false, error: "Failed to list schools" }
  }
}

/**
 * Create a new school with its first SCHOOL_ADMIN user - PLATFORM_SUPER_ADMIN only
 * Returns the temporary password in the success data (never logged)
 */
export async function createSchool(data: SchoolInput): Promise<ActionResult<{ schoolId: string; tempPassword: string }>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "create", "school")) {
    return { success: false, error: "Forbidden" }
  }

  const validation = schoolSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    // Create school and first admin in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const school = await tx.school.create({
        data: {
          name: validation.data.name,
          address: validation.data.address,
        },
      })

      const adminUser = await tx.user.create({
        data: {
          email: validation.data.adminEmail,
          passwordHash,
          role: "SCHOOL_ADMIN",
          schoolId: school.id,
        },
      })

      return { schoolId: school.id, adminUserId: adminUser.id }
    })

    return { success: true, data: { schoolId: result.schoolId, tempPassword } }
  } catch (error) {
    console.error("Error creating school:", error)
    return { success: false, error: "Failed to create school" }
  }
}

/**
 * Get statistics for a specific school - PLATFORM_SUPER_ADMIN only
 */
export async function getSchoolStats(schoolId: string): Promise<ActionResult<SchoolStats>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "view", "school")) {
    return { success: false, error: "Forbidden" }
  }

  try {
    const stats = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: {
            students: { where: { user: { active: true } } },
            teachers: { where: { user: { active: true } } },
            classrooms: true,
          },
        },
      },
    })

    if (!stats) {
      return { success: false, error: "School not found" }
    }

    return {
      success: true,
      data: {
        studentCount: stats._count.students,
        teacherCount: stats._count.teachers,
        classroomCount: stats._count.classrooms,
      },
    }
  } catch (error) {
    console.error("Error getting school stats:", error)
    return { success: false, error: "Failed to get school stats" }
  }
}
