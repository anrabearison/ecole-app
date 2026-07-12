import { z } from "zod"

export const periodSchema = z.object({
  name: z.string().min(1, "Le nom de la période est requis"),
  order: z.number().int().min(1, "L'ordre doit être un entier positif"),
  schoolYear: z.string().min(1, "L'année scolaire est requise"),
})

export type PeriodInput = z.infer<typeof periodSchema>
