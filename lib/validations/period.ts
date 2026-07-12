import { z } from "zod"

export const periodSchema = z.object({
  name: z.string().min(1, "Le nom de la période est requis"),
  order: z.number().int().min(1, "L'ordre doit être un entier positif"),
  schoolYear: z.string().min(1, "L'année scolaire est requise"),
  examWeight: z.number().min(0).max(1, "Le poids examen doit être entre 0 et 1"),
  dailyWeight: z.number().min(0).max(1, "Le poids journalier doit être entre 0 et 1"),
}).refine((data) => Math.abs(data.examWeight + data.dailyWeight - 1.0) < 0.01, {
  message: "La somme des poids doit être égale à 1.0",
})

export type PeriodInput = z.infer<typeof periodSchema>
