import { z } from "zod"

export const teacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
})

export type TeacherInput = z.infer<typeof teacherSchema>

export const teacherUpdateSchema = teacherSchema.partial()

export type TeacherUpdateInput = z.infer<typeof teacherUpdateSchema>

export const teacherSubjectSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  classroomId: z.string().min(1, "Classroom is required"),
})

export type TeacherSubjectInput = z.infer<typeof teacherSubjectSchema>
