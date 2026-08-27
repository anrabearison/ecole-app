import { z } from "zod"

const optionalStringSchema = z.string().optional()
const sexEnum = z.enum(["MALE", "FEMALE"])
const teacherContractTypeEnum = z.enum(["FONCTIONNAIRE", "ENF"])

const optionalEmail = z
  .string()
  .email("Adresse email invalide")
  .optional()
  .or(z.literal(""))

export const teacherSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: optionalEmail,
  phone: optionalStringSchema,
  contractType: teacherContractTypeEnum.optional(),
  registrationNumber: z.string().optional(),
  nationalIdNumber: z.string().min(1, "Le numéro CIN est requis"),
  sex: sexEnum,
})

export const teacherFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: optionalEmail,
  phone: z.string().optional(),
  contractType: z.enum(["FONCTIONNAIRE", "ENF"]).optional(),
  registrationNumber: z.string().optional(),
  nationalIdNumber: z.string().min(1, "Le numéro CIN est requis"),
  sex: z.enum(["MALE", "FEMALE"]),
})

export type TeacherInput = z.infer<typeof teacherSchema>
export type TeacherFormInput = z.infer<typeof teacherFormSchema>

export const teacherUpdateSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").optional(),
  lastName: z.string().min(1, "Le nom est requis").optional(),
  email: optionalEmail,
  phone: z.string().optional(),
  contractType: teacherContractTypeEnum.optional(),
  registrationNumber: z.string().optional(),
  nationalIdNumber: z.string().min(1, "Le numéro CIN est requis").optional(),
  sex: sexEnum.optional(),
})

export type TeacherUpdateInput = z.infer<typeof teacherUpdateSchema>

export const teacherSubjectSchema = z.object({
  subjectId: z.string().min(1, "La matière est requise"),
  classroomId: z.string().min(1, "La classe est requise"),
})

export type TeacherSubjectInput = z.infer<typeof teacherSubjectSchema>
