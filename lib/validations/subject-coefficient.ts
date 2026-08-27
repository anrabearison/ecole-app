import { z } from "zod"

export const SubjectCoefficientSchema = z.object({
  subjectId: z.string().min(1, "La matière est requise"),
  schoolGradeId: z.string().min(1, "Le niveau est requis"),
  // null = niveau sans série (6ème → Seconde), string = avec série (Première A, Terminale C…)
  trackId: z.string().nullable().optional(),
  coefficient: z
    .number({ message: "Le coefficient doit être un nombre" })
    .min(0, "Le coefficient ne peut pas être négatif")
    .max(20, "Le coefficient maximum est 20"),
})

export type SubjectCoefficientInput = z.infer<typeof SubjectCoefficientSchema>
