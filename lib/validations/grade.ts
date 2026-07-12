import { z } from "zod"

export const gradeSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  subjectId: z.string().min(1, "Subject ID is required"),
  classroomId: z.string().min(1, "Classroom ID is required"),
  type: z.enum(["EXAM", "DAILY"]),
  value: z.number().min(0).max(20, "Grade must be between 0 and 20"),
  date: z.string().or(z.date()),
  comment: z.string().optional(),
})

export type GradeInput = z.infer<typeof gradeSchema>

export const gradeUpdateSchema = gradeSchema.partial()

export type GradeUpdateInput = z.infer<typeof gradeUpdateSchema>

export const bulkGradeEntrySchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  value: z.number().min(0).max(20, "Grade must be between 0 and 20"),
})

export type BulkGradeEntry = z.infer<typeof bulkGradeEntrySchema>

export const bulkGradeCreateSchema = z.object({
  classroomId: z.string().min(1, "Classroom ID is required"),
  subjectId: z.string().min(1, "Subject ID is required"),
  periodId: z.string().min(1, "Period ID is required"),
  type: z.enum(["EXAM", "DAILY"]),
  date: z.string().or(z.date()),
  entries: z.array(bulkGradeEntrySchema).min(1, "At least one grade entry is required"),
})

export type BulkGradeCreateInput = z.infer<typeof bulkGradeCreateSchema>
