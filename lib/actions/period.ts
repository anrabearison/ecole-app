"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { periodSchema, type PeriodInput } from "@/lib/validations/period"
import type { ActionResult, PaginatedActionResult } from "@/lib/utils"

export type PeriodWithRelations = {
  id: string
  name: string
  order: number
  schoolYear: string
  schoolId: string
  examWeight: number
  dailyWeight: number
}

export async function listPeriods(opts?: { search?: string; page?: number; pageSize?: number }): Promise<PaginatedActionResult<PeriodWithRelations[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "view", "period", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  try {
    const search = opts?.search?.trim()
    const page = opts?.page && opts.page > 0 ? opts.page : 1
    const pageSize = opts?.pageSize && opts.pageSize > 0 ? opts.pageSize : 20

    const where: any = { schoolId: session.user.schoolId! }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { schoolYear: { contains: search, mode: "insensitive" } },
      ]
    }

    const [periods, total] = await Promise.all([
      prisma.period.findMany({
        where,
        orderBy: [{ schoolYear: "desc" }, { order: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.period.count({ where })
    ])

    const totalPages = Math.ceil(total / pageSize)

    return { 
      success: true, 
      data: periods as PeriodWithRelations[],
      pagination: {
        total,
        page,
        pageSize,
        totalPages
      }
    }
  } catch (error: any) {
    console.error("Error listing periods:", error)
    return { success: false, error: "Erreur lors du chargement des périodes" }
  }
}

export async function createPeriod(data: PeriodInput): Promise<ActionResult<PeriodWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "create", "period")) {
    return { success: false, error: "Forbidden" }
  }

  const validation = periodSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    const period = await prisma.period.create({
      data: {
        name: validation.data.name,
        order: validation.data.order,
        schoolYear: validation.data.schoolYear,
        examWeight: validation.data.examWeight,
        dailyWeight: validation.data.dailyWeight,
        schoolId: session.user.schoolId!,
      },
    })

    return { success: true, data: period as PeriodWithRelations }
  } catch (error: any) {
    console.error("Error creating period:", error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return { success: false, error: "Une période avec ce nom existe déjà pour cette année scolaire" }
    }
    
    // Handle missing schoolId
    if (!session.user.schoolId) {
      return { success: false, error: "L'identifiant de l'école est manquant" }
    }
    
    return { success: false, error: "Erreur lors de la création de la période" }
  }
}

export async function deletePeriod(formData: FormData): Promise<ActionResult<PeriodWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "delete", "period")) {
    return { success: false, error: "Forbidden" }
  }

  const id = formData.get("id") as string

  try {
    const period = await prisma.period.delete({
      where: { id, schoolId: session.user.schoolId! },
    })

    return { success: true, data: period as PeriodWithRelations }
  } catch (error: any) {
    console.error("Error deleting period:", error)
    return { success: false, error: "Erreur lors de la suppression de la période" }
  }
}
