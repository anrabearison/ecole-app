"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { createRoom } from "@/lib/actions/room"
import { roomSchema, type RoomInput } from "@/lib/validations/room"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewRoomPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoomInput>({
    resolver: zodResolver(roomSchema),
  })

  const onSubmit = async (data: RoomInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createRoom(data)

      if (result.success) {
        router.push("/admin/academics/rooms")
      } else {
        setError(result.error || "Failed to create room")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nouvelle salle</h1>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Nom de la salle</Label>
            <Input
              {...register("name")}
              id="name"
              placeholder="ex: Salle 1, Labo Sciences"
              className="mt-1"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Création..." : "Créer la salle"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
