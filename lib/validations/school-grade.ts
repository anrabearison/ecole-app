import { z } from "zod"

export const schoolGradeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  cycle: z.enum(["PRIMARY", "MIDDLE_SCHOOL", "HIGH_SCHOOL"]),
  order: z.number().int().min(0, "Order must be a non-negative integer"),
})

export type SchoolGradeInput = z.infer<typeof schoolGradeSchema>

export const schoolGradeUpdateSchema = schoolGradeSchema.partial()

export type SchoolGradeUpdateInput = z.infer<typeof schoolGradeUpdateSchema>
