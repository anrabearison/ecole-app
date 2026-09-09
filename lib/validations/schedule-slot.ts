import { z } from "zod"

const baseScheduleSlotSchema = z.object({
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  classroomId: z.string().min(1, "Classroom ID is required"),
  subjectId: z.string().min(1, "Subject ID is required"),
  teacherId: z.string().min(1, "Teacher ID is required"),
  roomId: z.string().nullable().optional(),
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

/**
 * Helper: convert HH:MM to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

/**
 * Helper: check if a time range overlaps with the school's break period
 */
export function overlapsBreak(
  startTime: string,
  endTime: string,
  morningEndTime: string,
  afternoonStartTime: string
): boolean {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  const breakStart = timeToMinutes(morningEndTime)
  const breakEnd = timeToMinutes(afternoonStartTime)
  // Overlap if slot starts before break ends AND slot ends after break starts
  return start < breakEnd && end > breakStart
}

/**
 * Helper: generate valid time options based on school schedule settings
 */
export function generateTimeSlots(
  scheduleStartTime: string,
  morningEndTime: string,
  afternoonStartTime: string,
  scheduleEndTime: string,
  slotDurationMinutes: number
): { value: string; label: string; isBreak: boolean }[] {
  const slots: { value: string; label: string; isBreak: boolean }[] = []
  const start = timeToMinutes(scheduleStartTime)
  const end = timeToMinutes(scheduleEndTime)
  const breakStart = timeToMinutes(morningEndTime)
  const breakEnd = timeToMinutes(afternoonStartTime)

  for (let t = start; t < end; t += slotDurationMinutes) {
    const h = Math.floor(t / 60)
    const m = t % 60
    const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
    const isBreak = t >= breakStart && t < breakEnd
    slots.push({
      value: timeStr,
      label: timeStr,
      isBreak,
    })
  }

  return slots
}
