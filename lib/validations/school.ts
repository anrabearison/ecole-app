import { z } from "zod"

export const schoolSchema = z.object({
  name: z.string().min(1, "Le nom de l'école est requis"),
  address: z.string().optional(),
  adminFirstName: z.string().min(1, "Le prénom de l'admin est requis"),
  adminLastName: z.string().min(1, "Le nom de l'admin est requis"),
  adminEmail: z.string().email("Email invalide"),
})

export type SchoolInput = z.infer<typeof schoolSchema>
