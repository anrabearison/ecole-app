import { z } from "zod"

export const reportCardCommentSchema = z.object({
  comment: z.string().min(1, "L'appréciation est requise"),
  studentId: z.string().min(1, "L'identifiant de l'élève est requis"),
  periodId: z.string().min(1, "L'identifiant de la période est requis"),
})

export type ReportCardCommentInput = z.infer<typeof reportCardCommentSchema>
