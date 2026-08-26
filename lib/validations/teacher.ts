import { z } from "zod"

const optionalStringSchema = z.string().optional()
const sexEnum = z.enum(["MALE", "FEMALE"])
const teacherContractTypeEnum = z.enum(["FONCTIONNAIRE", "ENF"])

export const teacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional(),
  phone: optionalStringSchema,
  contractType: teacherContractTypeEnum.optional(),
  registrationNumber: z.string().optional(),
  nationalIdNumber: z.string().min(1, "National ID number is required"),
  sex: sexEnum,
})

export const teacherFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  contractType: z.enum(["FONCTIONNAIRE", "ENF"]).optional(),
  registrationNumber: z.string().optional(),
  nationalIdNumber: z.string().min(1, "National ID number is required"),
  sex: z.enum(["MALE", "FEMALE"]),
})

export type TeacherInput = z.infer<typeof teacherSchema>
export type TeacherFormInput = z.infer<typeof teacherFormSchema>

export const teacherUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  contractType: teacherContractTypeEnum.optional(),
  registrationNumber: z.string().optional(),
  nationalIdNumber: z.string().min(1, "National ID number is required").optional(),
  sex: sexEnum.optional(),
})

export type TeacherUpdateInput = z.infer<typeof teacherUpdateSchema>

export const teacherSubjectSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  classroomId: z.string().min(1, "Classroom is required"),
})

export type TeacherSubjectInput = z.infer<typeof teacherSubjectSchema>
