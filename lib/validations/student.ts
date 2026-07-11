import { z } from "zod"

export const studentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  classroomId: z.string().optional(),
})

export type StudentInput = z.infer<typeof studentSchema>

export const studentUpdateSchema = studentSchema.partial()

export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>
