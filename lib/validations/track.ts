import { z } from "zod"

export const trackSchema = z.object({
  name: z.string().min(1, "Name is required"),
  schoolGradeId: z.string().min(1, "School Grade ID is required"),
})

export type TrackInput = z.infer<typeof trackSchema>

export const trackUpdateSchema = trackSchema.partial()

export type TrackUpdateInput = z.infer<typeof trackUpdateSchema>
