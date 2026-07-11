"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { teacherSubjectSchema, type TeacherSubjectInput } from "@/lib/validations/teacher"
import type { ActionResult } from "@/lib/utils"

type TeacherSubjectWithRelations = {
  id: string
  teacher: {
    id: string
    firstName: string
    lastName: string
  }
  subject: {
    id: string
    name: string
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
}

export async function listTeacherSubjects(teacherId: string): Promise<ActionResult<TeacherSubjectWithRelations[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "view", "teacher", { schoolId: session.user.schoolId || undefined, teacherId, ownerId: teacherId })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: {
        teacherId,
        schoolId: session.user.schoolId,
      },
      include: {
        teacher: {
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
        { classroom: { schoolYear: "desc" } },
      ],
    })

    return { success: true, data: teacherSubjects }
  } catch (error) {
    console.error("Error listing teacher subjects:", error)
    return { success: false, error: "Failed to list teacher subjects" }
  }
}

export async function assignTeacherSubject(data: TeacherSubjectInput & { teacherId: string }): Promise<ActionResult<TeacherSubjectWithRelations>> {
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

  const validation = teacherSubjectSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    // Verify teacher belongs to the school
    const teacher = await prisma.teacher.findUnique({
      where: { id: data.teacherId },
    })

    if (!teacher || teacher.schoolId !== session.user.schoolId) {
      return { success: false, error: "Teacher not found" }
    }

    // Verify subject belongs to the school
    const subject = await prisma.subject.findUnique({
      where: { id: data.subjectId },
    })

    if (!subject || subject.schoolId !== session.user.schoolId) {
      return { success: false, error: "Subject not found" }
    }

    // Verify classroom belongs to the school
    const classroom = await prisma.classroom.findUnique({
      where: { id: data.classroomId },
    })

    if (!classroom || classroom.schoolId !== session.user.schoolId) {
      return { success: false, error: "Classroom not found" }
    }

    // Check if this assignment already exists (unique constraint)
    const existing = await prisma.teacherSubject.findUnique({
      where: {
        teacherId_subjectId_classroomId: {
          teacherId: data.teacherId,
          subjectId: data.subjectId,
          classroomId: data.classroomId,
        },
      },
    })

    if (existing) {
      return { success: false, error: "This teacher is already assigned to this subject in this classroom" }
    }

    const teacherSubject = await prisma.teacherSubject.create({
      data: {
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        classroomId: data.classroomId,
        schoolId: session.user.schoolId,
      },
      include: {
        teacher: {
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

    return { success: true, data: teacherSubject }
  } catch (error) {
    console.error("Error assigning teacher subject:", error)
    return { success: false, error: "Failed to assign teacher subject" }
  }
}

export async function removeTeacherSubject(id: string): Promise<ActionResult<void>> {
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

  try {
    // Verify teacherSubject belongs to the school
    const teacherSubject = await prisma.teacherSubject.findUnique({
      where: { id },
    })

    if (!teacherSubject || teacherSubject.schoolId !== session.user.schoolId) {
      return { success: false, error: "Assignment not found" }
    }

    await prisma.teacherSubject.delete({
      where: { id },
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error removing teacher subject:", error)
    return { success: false, error: "Failed to remove teacher subject" }
  }
}

export async function getSubjects(): Promise<ActionResult<Array<{ id: string; name: string }>>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const subjects = await prisma.subject.findMany({
      where: {
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

    return { success: true, data: subjects }
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return { success: false, error: "Failed to fetch subjects" }
  }
}

export async function getClassrooms(): Promise<ActionResult<Array<{ id: string; name: string; schoolYear: string }>>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
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
            name: true,
          },
        },
      },
      orderBy: [
        { schoolYear: "desc" },
        { schoolGrade: { order: "asc" } },
      ],
    })

    const result = classrooms.map((c: any) => ({
      id: c.id,
      name: `${c.schoolGrade.name} ${c.section}`,
      schoolYear: c.schoolYear,
    }))

    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching classrooms:", error)
    return { success: false, error: "Failed to fetch classrooms" }
  }
}

export async function listTeacherSubjectsByClassroom(classroomId: string): Promise<ActionResult<TeacherSubjectWithRelations[]>> {
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
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: {
        classroomId,
        schoolId: session.user.schoolId,
      },
      include: {
        teacher: {
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
        { teacher: { lastName: "asc" } },
      ],
    })

    return { success: true, data: teacherSubjects }
  } catch (error) {
    console.error("Error listing teacher subjects by classroom:", error)
    return { success: false, error: "Failed to list teacher subjects" }
  }
}
