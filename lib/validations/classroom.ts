import { z } from "zod"

export const classroomSchema = z.object({
  schoolGradeId: z.string().min(1, "School grade is required"),
  trackId: z.string().optional(),
  section: z.string().min(1, "Section is required"),
  schoolYear: z.string().min(1, "School year is required"),
})

export type ClassroomInput = z.infer<typeof classroomSchema>

export const classroomUpdateSchema = classroomSchema.partial()

export type ClassroomUpdateInput = z.infer<typeof classroomUpdateSchema>
