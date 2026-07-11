"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { scheduleSlotSchema, scheduleSlotUpdateSchema, type ScheduleSlotInput, type ScheduleSlotUpdateInput } from "@/lib/validations/schedule-slot"
import type { ActionResult } from "@/lib/utils"

export type ScheduleSlotWithRelations = {
  id: string
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY"
  startTime: string
  endTime: string
  room: string | null
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
  subject: {
    id: string
    name: string
  }
  teacher: {
    id: string
    firstName: string
    lastName: string
  }
  schoolId: string
}

// Helper function to detect time overlap
function timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = parseInt(start1.replace(":", ""))
  const e1 = parseInt(end1.replace(":", ""))
  const s2 = parseInt(start2.replace(":", ""))
  const e2 = parseInt(end2.replace(":", ""))
  
  return s1 < e2 && s2 < e1
}

// Helper function to detect conflicts
async function detectConflicts(
  schoolId: string,
  day: string,
  startTime: string,
  endTime: string,
  teacherId: string,
  classroomId: string,
  room: string | null | undefined,
  excludeSlotId?: string
): Promise<string[]> {
  const conflicts: string[] = []

  // Find existing slots on the same day
  const existingSlots = await prisma.scheduleSlot.findMany({
    where: {
      schoolId,
      day: day as any,
      ...(excludeSlotId && { id: { not: excludeSlotId } }),
    },
  })

  // Check for teacher conflicts
  const teacherConflict = existingSlots.find(
    (slot: any) => 
      slot.teacherId === teacherId && 
      timeOverlaps(startTime, endTime, slot.startTime, slot.endTime)
  )
  if (teacherConflict) {
    conflicts.push(`Teacher already scheduled at this time`)
  }

  // Check for room conflicts (if room is specified)
  if (room) {
    const roomConflict = existingSlots.find(
      (slot: any) => 
        slot.room === room && 
        timeOverlaps(startTime, endTime, slot.startTime, slot.endTime)
    )
    if (roomConflict) {
      conflicts.push(`Room already occupied at this time`)
    }
  }

  return conflicts
}

export async function listScheduleSlotsForTeacher(): Promise<ActionResult<ScheduleSlotWithRelations[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.teacherId) {
    return { success: false, error: "Teacher ID is required" }
  }

  if (!can(session.user.role, "view", "schedule", { ownerId: session.user.teacherId, teacherId: session.user.teacherId, schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const slots = await prisma.scheduleSlot.findMany({
      where: {
        schoolId: session.user.schoolId,
        teacherId: session.user.teacherId, // CRITICAL: Only slots for this teacher
      },
      include: {
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
      },
      orderBy: [
        { day: "asc" },
        { startTime: "asc" },
      ],
    })

    return { success: true, data: slots as ScheduleSlotWithRelations[] }
  } catch (error) {
    console.error("Error listing schedule slots for teacher:", error)
    return { success: false, error: "Failed to list schedule slots" }
  }
}

export async function listScheduleSlotsForStudent(): Promise<ActionResult<ScheduleSlotWithRelations[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.studentId) {
    return { success: false, error: "Student ID is required" }
  }

  if (!can(session.user.role, "view", "schedule", { ownerId: session.user.studentId, studentId: session.user.studentId, schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    // Get the student's current classroom
    const student = await prisma.student.findUnique({
      where: { id: session.user.studentId },
      select: { classroomId: true },
    })

    if (!student?.classroomId) {
      return { success: false, error: "Student is not assigned to a classroom" }
    }

    const slots = await prisma.scheduleSlot.findMany({
      where: {
        schoolId: session.user.schoolId,
        classroomId: student.classroomId, // CRITICAL: Only slots for student's classroom
      },
      include: {
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
      },
      orderBy: [
        { day: "asc" },
        { startTime: "asc" },
      ],
    })

    return { success: true, data: slots as ScheduleSlotWithRelations[] }
  } catch (error) {
    console.error("Error listing schedule slots for student:", error)
    return { success: false, error: "Failed to list schedule slots" }
  }
}

export async function listScheduleSlotsForAdmin(filters?: {
  classroomId?: string
  teacherId?: string
}): Promise<ActionResult<ScheduleSlotWithRelations[]>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "view", "schedule", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    const slots = await prisma.scheduleSlot.findMany({
      where: {
        schoolId: session.user.schoolId,
        ...(filters?.classroomId && { classroomId: filters.classroomId }),
        ...(filters?.teacherId && { teacherId: filters.teacherId }),
      },
      include: {
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
      },
      orderBy: [
        { day: "asc" },
        { startTime: "asc" },
      ],
    })

    return { success: true, data: slots as ScheduleSlotWithRelations[] }
  } catch (error) {
    console.error("Error listing schedule slots for admin:", error)
    return { success: false, error: "Failed to list schedule slots" }
  }
}

export async function createScheduleSlot(data: ScheduleSlotInput): Promise<ActionResult<ScheduleSlotWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "create", "schedule", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = scheduleSlotSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    // CRITICAL: Check if teacher is assigned to this subject+class via TeacherSubject
    const teacherSubject = await prisma.teacherSubject.findUnique({
      where: {
        teacherId_subjectId_classroomId: {
          teacherId: data.teacherId,
          subjectId: data.subjectId,
          classroomId: data.classroomId,
        },
      },
    })

    if (!teacherSubject) {
      return { success: false, error: "Teacher is not assigned to teach this subject in this classroom" }
    }

    // Detect conflicts (non-blocking warning)
    const conflicts = await detectConflicts(
      session.user.schoolId,
      validation.data.day,
      validation.data.startTime,
      validation.data.endTime,
      validation.data.teacherId,
      validation.data.classroomId,
      validation.data.room
    )

    const slot = await prisma.scheduleSlot.create({
      data: {
        day: validation.data.day,
        startTime: validation.data.startTime,
        endTime: validation.data.endTime,
        room: validation.data.room,
        classroomId: validation.data.classroomId,
        subjectId: validation.data.subjectId,
        teacherId: validation.data.teacherId,
        schoolId: session.user.schoolId,
      },
      include: {
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
      },
    })

    if (conflicts.length > 0) {
      return { success: true, data: slot as ScheduleSlotWithRelations, warning: conflicts.join("; ") }
    }

    return { success: true, data: slot as ScheduleSlotWithRelations }
  } catch (error) {
    console.error("Error creating schedule slot:", error)
    return { success: false, error: "Failed to create schedule slot" }
  }
}

export async function updateScheduleSlot(id: string, data: ScheduleSlotUpdateInput): Promise<ActionResult<ScheduleSlotWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "update", "schedule", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const validation = scheduleSlotUpdateSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    // Get existing slot to check TeacherSubject assignment if classroom/subject/teacher changes
    const existingSlot = await prisma.scheduleSlot.findUnique({
      where: { id },
    })

    if (!existingSlot) {
      return { success: false, error: "Schedule slot not found" }
    }

    // If teacher, subject, or classroom is being changed, verify TeacherSubject assignment
    if (validation.data.teacherId || validation.data.subjectId || validation.data.classroomId) {
      const teacherId = validation.data.teacherId || existingSlot.teacherId
      const subjectId = validation.data.subjectId || existingSlot.subjectId
      const classroomId = validation.data.classroomId || existingSlot.classroomId

      const teacherSubject = await prisma.teacherSubject.findUnique({
        where: {
          teacherId_subjectId_classroomId: {
            teacherId,
            subjectId,
            classroomId,
          },
        },
      })

      if (!teacherSubject) {
        return { success: false, error: "Teacher is not assigned to teach this subject in this classroom" }
      }
    }

    // Detect conflicts (non-blocking warning)
    const conflicts = await detectConflicts(
      session.user.schoolId,
      validation.data.day || existingSlot.day,
      validation.data.startTime || existingSlot.startTime,
      validation.data.endTime || existingSlot.endTime,
      validation.data.teacherId || existingSlot.teacherId,
      validation.data.classroomId || existingSlot.classroomId,
      validation.data.room !== undefined ? validation.data.room : existingSlot.room,
      id // Exclude current slot from conflict check
    )

    const slot = await prisma.scheduleSlot.update({
      where: { id },
      data: {
        ...(validation.data.day !== undefined && { day: validation.data.day }),
        ...(validation.data.startTime !== undefined && { startTime: validation.data.startTime }),
        ...(validation.data.endTime !== undefined && { endTime: validation.data.endTime }),
        ...(validation.data.room !== undefined && { room: validation.data.room }),
        ...(validation.data.classroomId !== undefined && { classroomId: validation.data.classroomId }),
        ...(validation.data.subjectId !== undefined && { subjectId: validation.data.subjectId }),
        ...(validation.data.teacherId !== undefined && { teacherId: validation.data.teacherId }),
      },
      include: {
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
      },
    })

    if (conflicts.length > 0) {
      return { success: true, data: slot as ScheduleSlotWithRelations, warning: conflicts.join("; ") }
    }

    return { success: true, data: slot as ScheduleSlotWithRelations }
  } catch (error) {
    console.error("Error updating schedule slot:", error)
    return { success: false, error: "Failed to update schedule slot" }
  }
}

export async function deleteScheduleSlot(id: string): Promise<ActionResult<void>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!can(session.user.role, "delete", "schedule", { schoolId: session.user.schoolId || undefined })) {
    return { success: false, error: "Forbidden" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  try {
    await prisma.scheduleSlot.delete({
      where: { id },
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error deleting schedule slot:", error)
    return { success: false, error: "Failed to delete schedule slot" }
  }
}
