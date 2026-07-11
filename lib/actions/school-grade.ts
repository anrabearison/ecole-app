"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { schoolGradeSchema, schoolGradeUpdateSchema, type SchoolGradeInput, type SchoolGradeUpdateInput } from "@/lib/validations/school-grade"
import type { ActionResult } from "@/lib/utils"

type SchoolGradeWithRelations = {
  id: string
  name: string
  cycle: "PRIMARY" | "MIDDLE_SCHOOL" | "HIGH_SCHOOL"
  order: number
  schoolId: string
  tracks: {
    id: string
    name: string
  }[]
  classrooms: {
    id: string
    section: string
    schoolYear: string
  }[]
}

export async function listSchoolGrades(): Promise<ActionResult<SchoolGradeWithRelations[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "view", "school-grade", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const grades = await prisma.schoolGrade.findMany({
      where: {
        schoolId: session.user.schoolId,
      },
      include: {
        tracks: {
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: "asc",
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
      orderBy: [
        { cycle: "asc" },
        { order: "asc" },
      ],
    })

    return { success: true, data: grades as SchoolGradeWithRelations[] }
  } catch (error) {
    console.error("Error listing school grades:", error)
    return { success: false, error: "Failed to list school grades" }
  }
}

export async function createSchoolGrade(data: SchoolGradeInput): Promise<ActionResult<SchoolGradeWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "create", "school-grade", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = schoolGradeSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    const grade = await prisma.schoolGrade.create({
      data: {
        name: validation.data.name,
        cycle: validation.data.cycle,
        order: validation.data.order,
        schoolId: session.user.schoolId,
      },
      include: {
        tracks: {
          select: {
            id: true,
            name: true,
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

    return { success: true, data: grade as SchoolGradeWithRelations }
  } catch (error) {
    console.error("Error creating school grade:", error)
    return { success: false, error: "Failed to create school grade" }
  }
}

export async function updateSchoolGrade(id: string, data: SchoolGradeUpdateInput): Promise<ActionResult<SchoolGradeWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "update", "school-grade", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = schoolGradeUpdateSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    const grade = await prisma.schoolGrade.update({
      where: { id },
      data: {
        ...(validation.data.name !== undefined && { name: validation.data.name }),
        ...(validation.data.cycle !== undefined && { cycle: validation.data.cycle }),
        ...(validation.data.order !== undefined && { order: validation.data.order }),
      },
      include: {
        tracks: {
          select: {
            id: true,
            name: true,
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

    return { success: true, data: grade as SchoolGradeWithRelations }
  } catch (error) {
    console.error("Error updating school grade:", error)
    return { success: false, error: "Failed to update school grade" }
  }
}

export async function deleteSchoolGrade(id: string): Promise<ActionResult<void>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "delete", "school-grade", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    await prisma.schoolGrade.delete({
      where: { id },
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error deleting school grade:", error)
    return { success: false, error: "Failed to delete school grade" }
  }
}
