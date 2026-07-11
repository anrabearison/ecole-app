"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { gradeSchema, gradeUpdateSchema, bulkGradeCreateSchema, type GradeInput, type GradeUpdateInput, type BulkGradeCreateInput } from "@/lib/validations/grade"
import type { ActionResult } from "@/lib/utils"

type GradeWithRelations = {
  id: string
  value: number
  type: "EXAM" | "DAILY"
  date: Date
  comment: string | null
  student: {
    id: string
    firstName: string
    lastName: string
  }
  subject: {
    id: string
    name: string
  }
  teacher: {
    id: string
    firstName: string
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
  schoolId: string
  createdAt: Date
}

export async function listGradesForTeacher(filters?: {
  classroomId?: string
  subjectId?: string
  type?: "EXAM" | "DAILY"
}): Promise<ActionResult<GradeWithRelations[]>> {
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
    const grades = await prisma.grade.findMany({
      where: {
        schoolId: session.user.schoolId,
        teacherId: session.user.teacherId, // CRITICAL: Only grades entered by this teacher
        ...(filters?.classroomId && { classroomId: filters.classroomId }),
        ...(filters?.subjectId && { subjectId: filters.subjectId }),
        ...(filters?.type && { type: filters.type }),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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
      },
      orderBy: [
        { date: "desc" },
        { subject: { name: "asc" } },
        { student: { lastName: "asc" } },
      ],
    })

    return { success: true, data: grades }
  } catch (error) {
    console.error("Error listing grades for teacher:", error)
    return { success: false, error: "Failed to list grades" }
  }
}

export async function listGradesForStudent(): Promise<ActionResult<GradeWithRelations[]>> {
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
    const grades = await prisma.grade.findMany({
      where: {
        schoolId: session.user.schoolId,
        studentId: session.user.studentId, // CRITICAL: Only this student's grades
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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
      },
      orderBy: [
        { subject: { name: "asc" } },
        { date: "desc" },
      ],
    })

    return { success: true, data: grades }
  } catch (error) {
    console.error("Error listing grades for student:", error)
    return { success: false, error: "Failed to list grades" }
  }
}

export async function listGradesForAdmin(filters?: {
  classroomId?: string
  subjectId?: string
  teacherId?: string
  type?: "EXAM" | "DAILY"
  startDate?: string
  endDate?: string
}): Promise<ActionResult<GradeWithRelations[]>> {
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
    const grades = await prisma.grade.findMany({
      where: {
        schoolId: session.user.schoolId,
        ...(filters?.classroomId && { classroomId: filters.classroomId }),
        ...(filters?.subjectId && { subjectId: filters.subjectId }),
        ...(filters?.teacherId && { teacherId: filters.teacherId }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.startDate && { date: { gte: new Date(filters.startDate) } }),
        ...(filters?.endDate && { date: { lte: new Date(filters.endDate) } }),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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
      },
      orderBy: [
        { date: "desc" },
        { subject: { name: "asc" } },
        { student: { lastName: "asc" } },
      ],
    })

    return { success: true, data: grades }
  } catch (error) {
    console.error("Error listing grades for admin:", error)
    return { success: false, error: "Failed to list grades" }
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

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = bulkGradeCreateSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    const date = typeof data.date === 'string' ? new Date(data.date) : data.date

    // Create all grades in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const grades = await Promise.all(
        validation.data.entries.map((entry) =>
          tx.grade.create({
            data: {
              studentId: entry.studentId,
              subjectId: data.subjectId,
              classroomId: data.classroomId,
              teacherId: session.user.teacherId, // CRITICAL: Grade is attributed to the entering teacher
              type: data.type,
              value: entry.value,
              date,
              schoolId: session.user.schoolId,
            },
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
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
            },
          })
        )
      )
      return grades
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Error creating grades:", error)
    return { success: false, error: "Failed to create grades" }
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

  // CRITICAL: Check if grade belongs to this teacher
  const existingGrade = await prisma.grade.findUnique({
    where: { id },
  })

  if (!existingGrade) {
    return { success: false, error: "Grade not found" }
  }

  if (existingGrade.teacherId !== session.user.teacherId) {
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
    const grade = await prisma.grade.update({
      where: { id },
      data: {
        ...(validation.data.value !== undefined && { value: validation.data.value }),
        ...(validation.data.type !== undefined && { type: validation.data.type }),
        ...(validation.data.date !== undefined && { 
          date: typeof validation.data.date === 'string' ? new Date(validation.data.date) : validation.data.date 
        }),
        ...(validation.data.comment !== undefined && { comment: validation.data.comment }),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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
      },
    })

    return { success: true, data: grade }
  } catch (error) {
    console.error("Error updating grade:", error)
    return { success: false, error: "Failed to update grade" }
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

  // CRITICAL: Check if grade belongs to this teacher
  const existingGrade = await prisma.grade.findUnique({
    where: { id },
  })

  if (!existingGrade) {
    return { success: false, error: "Grade not found" }
  }

  if (existingGrade.teacherId !== session.user.teacherId) {
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
  } catch (error) {
    console.error("Error deleting grade:", error)
    return { success: false, error: "Failed to delete grade" }
  }
}

export async function getClassroomStudents(classroomId: string): Promise<ActionResult<Array<{ id: string; firstName: string; lastName: string }>>> {
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
  } catch (error) {
    console.error("Error fetching classroom students:", error)
    return { success: false, error: "Failed to fetch classroom students" }
  }
}
