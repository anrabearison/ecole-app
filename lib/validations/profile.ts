import { z } from "zod"

export const updateProfileSchema = z.object({
  email: z.string().email("Adresse email invalide").optional().or(z.literal("")),
  firstName: z.string().min(1, "Le prénom est requis").optional(),
  lastName: z.string().min(1, "Le nom est requis").optional(),
  phone: z.string().optional().nullable(),
  guardianName: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
    newPassword: z
      .string()
      .min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z.string().min(1, "La confirmation du mot de passe est requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
