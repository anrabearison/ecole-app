import { z } from "zod"

const optionalStringSchema = z.string().optional()

const studentStatusEnum = z.enum(["PASSING", "REPEATING", "TRIPLING"])
const sexEnum = z.enum(["MALE", "FEMALE"])

export const studentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional(),
  classroomId: optionalStringSchema,
  dateOfBirth: z.coerce.date().optional(),
  guardianName: optionalStringSchema,
  guardianPhone: optionalStringSchema,
  registrationNumber: z.string().min(1, "Registration number is required"),
  status: studentStatusEnum,
  placeOfBirth: z.string().optional(),
  sex: sexEnum,
})

export const studentFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional(),
  classroomId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  registrationNumber: z.string().min(1, "Registration number is required"),
  status: z.enum(["PASSING", "REPEATING", "TRIPLING"]).optional(),
  placeOfBirth: z.string().optional(),
  sex: z.enum(["MALE", "FEMALE"]),
})

export type StudentInput = z.infer<typeof studentSchema>
export type StudentFormInput = z.infer<typeof studentFormSchema>

export const studentUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  classroomId: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  registrationNumber: z.string().min(1, "Registration number is required").optional(),
  status: studentStatusEnum.optional(),
  placeOfBirth: z.string().optional(),
  sex: sexEnum.optional(),
})

export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>
