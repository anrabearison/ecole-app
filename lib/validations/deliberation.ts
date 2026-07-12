import { z } from "zod"

export const deliberationSchema = z.object({
  schoolYear: z.string().regex(/^\d{4}-\d{4}$/, "School year must be in YYYY-YYYY format (e.g., 2025-2026)"),
  observations: z.string().max(1000, "Les observations ne doivent pas dépasser 1000 caractères").optional(),
})

export type DeliberationInput = z.infer<typeof deliberationSchema>

export const deliberationObservationSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  schoolYear: z.string().regex(/^\d{4}-\d{4}$/, "School year must be in YYYY-YYYY format (e.g., 2025-2026)"),
  observations: z.string().max(1000, "Les observations ne doivent pas dépasser 1000 caractères").optional(),
})

export type DeliberationObservationInput = z.infer<typeof deliberationObservationSchema>
