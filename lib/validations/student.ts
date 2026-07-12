import { z } from "zod"

const optionalStringSchema = z.string().optional()

export const studentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  classroomId: optionalStringSchema,
  dateOfBirth: z.coerce.date().optional(),
  guardianName: optionalStringSchema,
  guardianPhone: optionalStringSchema,
})

export const studentFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  classroomId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
})

export type StudentInput = z.infer<typeof studentSchema>
export type StudentFormInput = z.infer<typeof studentFormSchema>

export const studentUpdateSchema = studentSchema.partial()

export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>
