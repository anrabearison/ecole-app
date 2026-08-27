import { z } from "zod"

export const subjectSchema = z.object({
  name: z.string().min(2, "Le nom de la matière doit faire au moins 2 caractères"),
  coefficient: z.number().min(0, "Le coefficient ne peut pas être négatif"),
})

export type SubjectInput = z.infer<typeof subjectSchema>
