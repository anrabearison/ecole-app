import { z } from "zod"

export const roomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
})

export type RoomInput = z.infer<typeof roomSchema>
