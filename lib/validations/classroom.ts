import { z } from "zod"

export const classroomSchema = z.object({
  schoolGradeId: z.string().min(1, "School grade is required"),
  trackId: z.string().optional(),
  section: z.string().min(1, "Section is required"),
  schoolYear: z.string().regex(/^\d{4}-\d{4}$/, "School year must be in YYYY-YYYY format (e.g., 2025-2026)"),
})

export type ClassroomInput = z.infer<typeof classroomSchema>

export const classroomUpdateSchema = classroomSchema.partial()

export type ClassroomUpdateInput = z.infer<typeof classroomUpdateSchema>
