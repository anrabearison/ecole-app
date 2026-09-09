import { z } from "zod"

export const schoolSchema = z.object({
  name: z.string().min(1, "Le nom de l'école est requis"),
  address: z.string().optional(),
  adminFirstName: z.string().min(1, "Le prénom de l'admin est requis"),
  adminLastName: z.string().min(1, "Le nom de l'admin est requis"),
  adminEmail: z.string().email("Email invalide").optional(),
})

export type SchoolInput = z.infer<typeof schoolSchema>

const timeRegex = /^\d{2}:\d{2}$/

export const scheduleSettingsSchema = z.object({
  scheduleStartTime: z.string().regex(timeRegex, "Format HH:MM requis"),
  morningEndTime: z.string().regex(timeRegex, "Format HH:MM requis"),
  afternoonStartTime: z.string().regex(timeRegex, "Format HH:MM requis"),
  scheduleEndTime: z.string().regex(timeRegex, "Format HH:MM requis"),
  slotDurationMinutes: z.number().int().min(15, "Minimum 15 minutes").max(180, "Maximum 3 heures"),
}).refine((data) => {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number)
    return h * 60 + m
  }
  const start = toMinutes(data.scheduleStartTime)
  const morningEnd = toMinutes(data.morningEndTime)
  const afternoonStart = toMinutes(data.afternoonStartTime)
  const end = toMinutes(data.scheduleEndTime)
  return start < morningEnd && morningEnd <= afternoonStart && afternoonStart < end
}, {
  message: "Les horaires doivent respecter l'ordre : Entrée < Fin matin ≤ Reprise après-midi < Sortie",
})

export type ScheduleSettingsInput = z.infer<typeof scheduleSettingsSchema>
