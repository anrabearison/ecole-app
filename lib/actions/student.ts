import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { studentSchema, studentUpdateSchema, type StudentInput, type StudentUpdateInput } from "@/lib/validations/student"
import type { ActionResult } from "@/lib/utils"
import bcrypt from "bcryptjs"

type StudentWithRelations = {
  id: string
  firstName: string
  lastName: string
  user: {
    id: string
    email: string
    active: boolean
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
  } | null
  schoolId: string
  createdAt: Date
}

type StudentCreateResult = {
  student: StudentWithRelations
  temporaryPassword: string
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

export async function listStudents(): Promise<ActionResult<StudentWithRelations[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "view", "student", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const students = await prisma.student.findMany({
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
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    })

    return { success: true, data: students }
  } catch (error) {
    console.error("Error listing students:", error)
    return { success: false, error: "Failed to list students" }
  }
}

export async function createStudent(data: StudentInput): Promise<ActionResult<StudentCreateResult>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "create", "student", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = studentSchema.safeParse(data)

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

    // If classroomId is provided, verify it belongs to the school
    let classroom = null
    if (data.classroomId) {
      classroom = await prisma.classroom.findUnique({
        where: { id: data.classroomId },
      })

      if (!classroom || classroom.schoolId !== session.user.schoolId) {
        return { success: false, error: "Invalid classroom" }
      }
    }

    // Generate temporary password (8 characters)
    const tempPassword = Math.random().toString(36).slice(-8)
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    // Create User and Student in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "STUDENT",
          schoolId: session.user.schoolId,
          active: true,
        },
      })

      const student = await tx.student.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          schoolId: session.user.schoolId,
          classroomId: data.classroomId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              active: true,
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

      // If classroom is assigned, create enrollment for the classroom's school year
      if (classroom) {
        await tx.enrollment.create({
          data: {
            studentId: student.id,
            classroomId: classroom.id,
            schoolYear: classroom.schoolYear,
            schoolId: session.user.schoolId,
          },
        })
      }

      return student
    })

    // Return the temporary password once in the response for display to the admin
    // The password is never stored in clear text or logged
    return { success: true, data: { student: result, temporaryPassword: tempPassword } }
  } catch (error) {
    console.error("Error creating student:", error)
    return { success: false, error: "Failed to create student" }
  }
}

export async function updateStudent(id: string, data: StudentUpdateInput): Promise<ActionResult<StudentWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "update", "student", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = studentUpdateSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    // Verify student belongs to the school
    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: {
        classroom: true,
      },
    })

    if (!existingStudent || existingStudent.schoolId !== session.user.schoolId) {
      return { success: false, error: "Student not found" }
    }

    // If email is being updated, check if it's already taken by another user
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (existingUser && existingUser.id !== existingStudent.userId) {
        return { success: false, error: "Email already exists" }
      }
    }

    // If classroomId is being updated, verify it belongs to the school
    let classroom = null
    if (data.classroomId) {
      classroom = await prisma.classroom.findUnique({
        where: { id: data.classroomId },
      })

      if (!classroom || classroom.schoolId !== session.user.schoolId) {
        return { success: false, error: "Invalid classroom" }
      }
    }

    // Update in transaction to handle enrollment if classroom changes
    const result = await prisma.$transaction(async (tx: any) => {
      // Update user email if provided
      if (data.email) {
        await tx.user.update({
          where: { id: existingStudent.userId },
          data: { email: data.email },
        })
      }

      // Update student
      const student = await tx.student.update({
        where: { id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          classroomId: data.classroomId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              active: true,
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

      // If classroom changed, create new enrollment for the new classroom's school year
      if (data.classroomId && data.classroomId !== existingStudent.classroomId && classroom) {
        // Check if enrollment already exists for this school year

        const existingEnrollment = await tx.enrollment.findUnique({
          where: {
            studentId_schoolYear: {
              studentId: id,
              schoolYear: classroom.schoolYear,
            },
          },
        })

        if (!existingEnrollment) {
          await tx.enrollment.create({
            data: {
              studentId: id,
              classroomId: classroom.id,
              schoolYear: classroom.schoolYear,
              schoolId: session.user.schoolId,
            },
          })
        }
      }

      return student
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Error updating student:", error)
    return { success: false, error: "Failed to update student" }
  }
}

export async function deleteStudent(id: string): Promise<ActionResult<void>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "delete", "student", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    // Verify student belongs to the school
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })

    if (!student || student.schoolId !== session.user.schoolId) {
      return { success: false, error: "Student not found" }
    }

    // Deactivate the user account instead of deleting
    await prisma.user.update({
      where: { id: student.userId },
      data: { active: false },
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error deleting student:", error)
    return { success: false, error: "Failed to delete student" }
  }
}
