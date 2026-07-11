import { z } from "zod"

const baseScheduleSlotSchema = z.object({
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  classroomId: z.string().min(1, "Classroom ID is required"),
  subjectId: z.string().min(1, "Subject ID is required"),
  teacherId: z.string().min(1, "Teacher ID is required"),
  room: z.string().optional(),
})

export const scheduleSlotSchema = baseScheduleSlotSchema.refine((data) => {
  const start = parseInt(data.startTime.replace(":", ""))
  const end = parseInt(data.endTime.replace(":", ""))
  return start < end
}, {
  message: "Start time must be before end time",
  path: ["endTime"],
})

export type ScheduleSlotInput = z.infer<typeof scheduleSlotSchema>

export const scheduleSlotUpdateSchema = baseScheduleSlotSchema.partial()

export type ScheduleSlotUpdateInput = z.infer<typeof scheduleSlotUpdateSchema>
