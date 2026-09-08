"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { gradeSchema, gradeUpdateSchema, bulkGradeCreateSchema, type GradeInput, type GradeUpdateInput, type BulkGradeCreateInput } from "@/lib/validations/grade"
import type { ActionResult, PaginatedActionResult } from "@/lib/utils"
import { revalidatePath } from "next/cache"

export type GradeWithRelations = {
  id: string
  value: number
  type: "EXAM" | "DAILY"
  date: Date
  comment: string | null
  student: {
    id: string
    firstName: string | null
    lastName: string
  }
  subject: {
    id: string
    name: string
  }
  teacher: {
    id: string
    firstName: string | null
    lastName: string
  }
  classroom: {
    id: string
    section: string
    schoolYear: string
    schoolGrade: {
      id: string
      name: string
      cycle: string
    }
  }
  period?: {
    id: string
    name: string
  }
  assessment?: {
    id: string
    date: Date
    type: "EXAM" | "DAILY"
    title: string | null
    periodId: string
    period?: {
      id: string
      name: string
    }
  }
  schoolId: string
  createdAt: Date
}

const assessmentInclude = {
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  assessment: {
    include: {
      subject: {
        select: {
          id: true,
          name: true,
        },
      },
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      classroom: {
        include: {
          schoolGrade: {
            select: {
              id: true,
              name: true,
              cycle: true,
            },
          },
        },
      },
      period: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
}

function mapGradeToRelations(g: any): GradeWithRelations {
  return {
    id: g.id,
    value: g.value,
    comment: g.comment,
    type: g.assessment.type,
    date: g.assessment.date,
    student: g.student,
    subject: g.assessment.subject,
    teacher: g.assessment.teacher,
    classroom: g.assessment.classroom,
    period: g.assessment.period,
    assessment: {
      id: g.assessment.id,
      date: g.assessment.date,
      type: g.assessment.type,
      title: g.assessment.title,
      periodId: g.assessment.periodId,
      period: g.assessment.period,
    },
    schoolId: g.assessment.schoolId,
    createdAt: g.createdAt,
  }
}

export async function listAssessmentDates(filters?: {
  classroomId?: string
  subjectId?: string
  teacherId?: string
  periodId?: string
  type?: "EXAM" | "DAILY"
}): Promise<ActionResult<Array<{ date: string; label: string }>>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const where: Record<string, unknown> = {
      schoolId: session.user.schoolId,
      ...(session.user.role === "TEACHER" && session.user.teacherId && { teacherId: session.user.teacherId }),
      ...(filters?.classroomId && { classroomId: filters.classroomId }),
      ...(filters?.subjectId && { subjectId: filters.subjectId }),
      ...(filters?.teacherId && { teacherId: filters.teacherId }),
      ...(filters?.periodId && { periodId: filters.periodId }),
      ...(filters?.type && { type: filters.type }),
    }

    const assessments = await prisma.assessment.findMany({
      where,
      select: {
        date: true,
        title: true,
        type: true,
      },
      orderBy: { date: "desc" },
    })

    const dateMap = new Map<string, string>()
    assessments.forEach((a) => {
      const dateKey = a.date.toISOString().split("T")[0]
      if (!dateMap.has(dateKey)) {
        const dateStr = new Date(a.date).toLocaleDateString("fr-FR")
        const label = a.title ? `${dateStr} (${a.title})` : dateStr
        dateMap.set(dateKey, label)
      }
    })

    const result = Array.from(dateMap.entries()).map(([date, label]) => ({
      date,
      label,
    }))

    return { success: true, data: result }
  } catch (error: any) {
    console.error("Error listing assessment dates:", error)
    return { success: false, error: "Erreur lors du chargement des dates d'évaluation" }
  }
}

export async function listGradesForTeacher(filters?: {
  classroomId?: string
  subjectId?: string
  type?: "EXAM" | "DAILY"
  studentId?: string
  periodId?: string
  date?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}): Promise<PaginatedActionResult<GradeWithRelations[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.teacherId) {
    return { success: false, error: "Teacher ID is required" }
  }

  if (!can(session.user.role, "view", "grade", { ownerId: session.user.teacherId, teacherId: session.user.teacherId, schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const page = filters?.page && filters.page > 0 ? filters.page : 1
    const pageSize = filters?.pageSize && filters.pageSize > 0 ? filters.pageSize : 20

    const dateFilter: Record<string, Date> = {}
    if (filters?.date) {
      const start = new Date(filters.date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(filters.date)
      end.setHours(23, 59, 59, 999)
      dateFilter.gte = start
      dateFilter.lte = end
    } else {
      if (filters?.startDate) {
        const start = new Date(filters.startDate)
        start.setHours(0, 0, 0, 0)
        dateFilter.gte = start
      }
      if (filters?.endDate) {
        const end = new Date(filters.endDate)
        end.setHours(23, 59, 59, 999)
        dateFilter.lte = end
      }
    }

    const assessmentWhere: Record<string, unknown> = {
      schoolId: session.user.schoolId,
      teacherId: session.user.teacherId, // CRITICAL: Only grades entered by this teacher
      ...(filters?.classroomId && { classroomId: filters.classroomId }),
      ...(filters?.subjectId && { subjectId: filters.subjectId }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.periodId && { periodId: filters.periodId }),
    }

    if (Object.keys(dateFilter).length > 0) {
      assessmentWhere.date = dateFilter
    }

    const where: Record<string, unknown> = {
      ...(filters?.studentId && { studentId: filters.studentId }),
      assessment: assessmentWhere,
    }

    const [rawGrades, total] = await Promise.all([
      prisma.grade.findMany({
        where,
        include: assessmentInclude,
        orderBy: [
          { assessment: { date: "desc" } },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.grade.count({ where }),
    ])

    const grades = rawGrades.map(mapGradeToRelations)

    grades.sort((a, b) => {
      const dateComp = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateComp !== 0) return dateComp
      const subjectComp = (a.subject?.name || "").localeCompare(b.subject?.name || "")
      if (subjectComp !== 0) return subjectComp
      return (a.student?.lastName || "").localeCompare(b.student?.lastName || "")
    })

    const totalPages = Math.ceil(total / pageSize)

    return { 
      success: true, 
      data: grades,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error: any) {
    console.error("Error listing grades for teacher:", error)
    return { success: false, error: "Erreur lors du chargement des notes" }
  }
}

export async function listGradesForStudent(filters?: {
  periodId?: string
  page?: number
  pageSize?: number
}): Promise<PaginatedActionResult<GradeWithRelations[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.studentId) {
    return { success: false, error: "Student ID is required" }
  }

  if (!can(session.user.role, "view", "grade", { ownerId: session.user.studentId, studentId: session.user.studentId, schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const page = filters?.page && filters.page > 0 ? filters.page : 1
    const pageSize = filters?.pageSize && filters.pageSize > 0 ? filters.pageSize : 20

    const where: Record<string, unknown> = {
      studentId: session.user.studentId, // CRITICAL: Only this student's grades
      assessment: {
        schoolId: session.user.schoolId,
        ...(filters?.periodId && { periodId: filters.periodId }),
      },
    }

    const [rawGrades, total] = await Promise.all([
      prisma.grade.findMany({
        where,
        include: assessmentInclude,
        orderBy: [
          { assessment: { date: "desc" } },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.grade.count({ where }),
    ])

    const grades = rawGrades.map(mapGradeToRelations)

    grades.sort((a, b) => {
      const subjectComp = (a.subject?.name || "").localeCompare(b.subject?.name || "")
      if (subjectComp !== 0) return subjectComp
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    const totalPages = Math.ceil(total / pageSize)

    return { 
      success: true, 
      data: grades,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error: any) {
    console.error("Error listing grades for student:", error)
    return { success: false, error: "Erreur lors du chargement des notes" }
  }
}

export async function listGradesForAdmin(filters?: {
  classroomId?: string
  subjectId?: string
  teacherId?: string
  studentId?: string
  periodId?: string
  type?: "EXAM" | "DAILY"
  date?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}): Promise<PaginatedActionResult<GradeWithRelations[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "view", "grade", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const page = filters?.page && filters.page > 0 ? filters.page : 1
    const pageSize = filters?.pageSize && filters.pageSize > 0 ? filters.pageSize : 20

    const dateFilter: Record<string, Date> = {}
    if (filters?.date) {
      const start = new Date(filters.date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(filters.date)
      end.setHours(23, 59, 59, 999)
      dateFilter.gte = start
      dateFilter.lte = end
    } else {
      if (filters?.startDate) {
        const start = new Date(filters.startDate)
        start.setHours(0, 0, 0, 0)
        dateFilter.gte = start
      }
      if (filters?.endDate) {
        const end = new Date(filters.endDate)
        end.setHours(23, 59, 59, 999)
        dateFilter.lte = end
      }
    }

    const assessmentWhere: Record<string, unknown> = {
      schoolId: session.user.schoolId,
      ...(filters?.classroomId && { classroomId: filters.classroomId }),
      ...(filters?.subjectId && { subjectId: filters.subjectId }),
      ...(filters?.teacherId && { teacherId: filters.teacherId }),
      ...(filters?.periodId && { periodId: filters.periodId }),
      ...(filters?.type && { type: filters.type }),
    }

    if (Object.keys(dateFilter).length > 0) {
      assessmentWhere.date = dateFilter
    }

    const where: Record<string, unknown> = {
      ...(filters?.studentId && { studentId: filters.studentId }),
      assessment: assessmentWhere,
    }

    const [rawGrades, total] = await Promise.all([
      prisma.grade.findMany({
        where,
        include: assessmentInclude,
        orderBy: [
          { assessment: { date: "desc" } },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.grade.count({ where }),
    ])

    const grades = rawGrades.map(mapGradeToRelations)

    grades.sort((a, b) => {
      const dateComp = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateComp !== 0) return dateComp
      const subjectComp = (a.subject?.name || "").localeCompare(b.subject?.name || "")
      if (subjectComp !== 0) return subjectComp
      return (a.student?.lastName || "").localeCompare(b.student?.lastName || "")
    })

    const totalPages = Math.ceil(total / pageSize)

    return { 
      success: true, 
      data: grades,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error: any) {
    console.error("Error listing grades for admin:", error)
    return { success: false, error: "Erreur lors du chargement des notes" }
  }
}

export async function createGrades(data: BulkGradeCreateInput): Promise<ActionResult<GradeWithRelations[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.teacherId) {
    return { success: false, error: "Teacher ID is required" }
  }

  if (!can(session.user.role, "create", "grade", { teacherId: session.user.teacherId, schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = bulkGradeCreateSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    // CRITICAL: Check if teacher is assigned to this subject+class via TeacherSubject
    const teacherSubject = await prisma.teacherSubject.findUnique({
      where: {
        teacherId_subjectId_classroomId: {
          teacherId: session.user.teacherId,
          subjectId: data.subjectId,
          classroomId: data.classroomId,
        },
      },
    })

    if (!teacherSubject) {
      return { success: false, error: "You are not assigned to teach this subject in this classroom" }
    }

    const date = typeof data.date === "string" ? new Date(data.date) : data.date

    // Create assessment event + grades in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const assessment = await tx.assessment.create({
        data: {
          classroomId: data.classroomId,
          subjectId: data.subjectId,
          periodId: data.periodId,
          teacherId: session.user.teacherId,
          schoolId: session.user.schoolId,
          type: data.type,
          date,
          title: data.title || null,
        },
      })

      const rawGrades = await Promise.all(
        validation.data.entries.map((entry) =>
          tx.grade.create({
            data: {
              studentId: entry.studentId,
              value: entry.value,
              comment: entry.comment || null,
              assessmentId: assessment.id,
            },
            include: assessmentInclude,
          })
        )
      )

      return rawGrades.map(mapGradeToRelations)
    })

    return { success: true, data: result }
  } catch (error: any) {
    console.error("Error creating grades:", error)
    return { success: false, error: "Erreur lors de la création des notes" }
  }
}

export async function updateGrade(id: string, data: GradeUpdateInput): Promise<ActionResult<GradeWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.teacherId) {
    return { success: false, error: "Teacher ID is required" }
  }

  // CRITICAL: Check if grade belongs to an assessment created by this teacher
  const existingGrade = await prisma.grade.findUnique({
    where: { id },
    include: { assessment: true },
  })

  if (!existingGrade) {
    return { success: false, error: "Grade not found" }
  }

  if (existingGrade.assessment.teacherId !== session.user.teacherId) {
    return { success: false, error: "You can only modify grades you have entered" }
  }

  if (!can(session.user.role, "update", "grade", { teacherId: session.user.teacherId, schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = gradeUpdateSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    if (validation.data.date !== undefined || validation.data.type !== undefined) {
      await prisma.assessment.update({
        where: { id: existingGrade.assessmentId },
        data: {
          ...(validation.data.type !== undefined && { type: validation.data.type }),
          ...(validation.data.date !== undefined && { 
            date: typeof validation.data.date === 'string' ? new Date(validation.data.date) : validation.data.date 
          }),
        },
      })
    }

    const rawGrade = await prisma.grade.update({
      where: { id },
      data: {
        ...(validation.data.value !== undefined && { value: validation.data.value }),
        ...(validation.data.comment !== undefined && { comment: validation.data.comment }),
      },
      include: assessmentInclude,
    })

    return { success: true, data: mapGradeToRelations(rawGrade) }
  } catch (error: any) {
    console.error("Error updating grade:", error)
    return { success: false, error: "Erreur lors de la mise à jour de la note" }
  }
}

export async function deleteGrade(id: string): Promise<ActionResult<void>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.teacherId) {
    return { success: false, error: "Teacher ID is required" }
  }

  // CRITICAL: Check if grade belongs to an assessment entered by this teacher
  const existingGrade = await prisma.grade.findUnique({
    where: { id },
    include: { assessment: true },
  })

  if (!existingGrade) {
    return { success: false, error: "Grade not found" }
  }

  if (existingGrade.assessment.teacherId !== session.user.teacherId) {
    return { success: false, error: "You can only delete grades you have entered" }
  }

  if (!can(session.user.role, "delete", "grade", { teacherId: session.user.teacherId, schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    await prisma.grade.delete({
      where: { id },
    })

    return { success: true, data: undefined }
  } catch (error: any) {
    console.error("Error deleting grade:", error)
    return { success: false, error: "Erreur lors de la suppression de la note" }
  }
}

export async function getGradeById(id: string): Promise<ActionResult<GradeWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "view", "grade", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const rawGrade = await prisma.grade.findFirst({
      where: { 
        id, 
        assessment: { schoolId: session.user.schoolId },
      },
      include: assessmentInclude,
    })

    if (!rawGrade) {
      return { success: false, error: "Note non trouvée" }
    }

    return { success: true, data: mapGradeToRelations(rawGrade) }
  } catch (error: any) {
    console.error("Error fetching grade by id:", error)
    return { success: false, error: "Erreur lors du chargement de la note" }
  }
}

export async function updateGradeForAdmin(id: string, data: GradeUpdateInput): Promise<ActionResult<GradeWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  // Only SCHOOL_ADMIN and PLATFORM_ADMIN can use this
  if (!can(session.user.role, "view", "grade", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  // Teachers cannot use this endpoint (use updateGrade instead)
  if (session.user.role === "TEACHER") {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const existingGrade = await prisma.grade.findFirst({
    where: { 
      id, 
      assessment: { schoolId: session.user.schoolId },
    },
    include: { assessment: true },
  })

  if (!existingGrade) {
    return { success: false, error: "Note non trouvée" }
  }

  const validation = gradeUpdateSchema.safeParse(data)
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    if (validation.data.date !== undefined || validation.data.type !== undefined) {
      await prisma.assessment.update({
        where: { id: existingGrade.assessmentId },
        data: {
          ...(validation.data.type !== undefined && { type: validation.data.type }),
          ...(validation.data.date !== undefined && {
            date: typeof validation.data.date === "string" ? new Date(validation.data.date) : validation.data.date,
          }),
        },
      })
    }

    const rawGrade = await prisma.grade.update({
      where: { id },
      data: {
        ...(validation.data.value !== undefined && { value: validation.data.value }),
        ...(validation.data.comment !== undefined && { comment: validation.data.comment }),
      },
      include: assessmentInclude,
    })

    revalidatePath("/admin/grades")
    revalidatePath(`/admin/grades/${id}`)

    return { success: true, data: mapGradeToRelations(rawGrade) }
  } catch (error: any) {
    console.error("Error updating grade for admin:", error)
    return { success: false, error: "Erreur lors de la mise à jour de la note" }
  }
}

export async function getClassroomStudents(classroomId: string): Promise<ActionResult<Array<{ id: string; firstName: string | null; lastName: string }>>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const students = await prisma.student.findMany({
      where: {
        schoolId: session.user.schoolId,
        classroomId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    })

    return { success: true, data: students }
  } catch (error: any) {
    console.error("Error fetching classroom students:", error)
    return { success: false, error: "Erreur lors du chargement des élèves de la classe" }
  }
}
