import { z } from "zod"

export const schoolSchema = z.object({
  name: z.string().min(1, "Le nom de l'école est requis"),
  address: z.string().optional(),
  adminFirstName: z.string().min(1, "Le prénom de l'admin est requis"),
  adminLastName: z.string().min(1, "Le nom de l'admin est requis"),
  adminEmail: z.string().email("Email invalide"),
})

export type SchoolInput = z.infer<typeof schoolSchema>

export const schoolWeightingSchema = z.object({
  examWeight: z.number().min(0).max(1, "Le poids examen doit être entre 0 et 1"),
  dailyWeight: z.number().min(0).max(1, "Le poids journalier doit être entre 0 et 1"),
}).refine((data) => Math.abs(data.examWeight + data.dailyWeight - 1.0) < 0.01, {
  message: "La somme des poids doit être égale à 1.0",
})

export type SchoolWeightingInput = z.infer<typeof schoolWeightingSchema>
