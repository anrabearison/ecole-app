"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createScheduleSlot } from "@/lib/actions/schedule-slot"
import { scheduleSlotSchema, type ScheduleSlotInput } from "@/lib/validations/schedule-slot"
import { Button } from "@/components/ui/button"

export default function NewScheduleSlotPage() {
  const [warning, setWarning] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScheduleSlotInput>({
    resolver: zodResolver(scheduleSlotSchema),
  })

  const onSubmit = async (data: ScheduleSlotInput) => {
    setIsSubmitting(true)
    setWarning(null)
    setSuccess(false)

    const result = await createScheduleSlot(data)

    if (result.success) {
      setSuccess(true)
      if (result.warning) {
        setWarning(result.warning)
      }
    } else {
      alert(result.error)
    }

    setIsSubmitting(false)
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Créer un créneau d'emploi du temps</h1>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">Créneau créé avec succès</p>
        </div>
      )}

      {warning && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 font-medium">Attention : {warning}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Jour</label>
          <select
            {...register("day")}
            className="w-full border rounded px-3 py-2"
          >
            <option value="MONDAY">Lundi</option>
            <option value="TUESDAY">Mardi</option>
            <option value="WEDNESDAY">Mercredi</option>
            <option value="THURSDAY">Jeudi</option>
            <option value="FRIDAY">Vendredi</option>
            <option value="SATURDAY">Samedi</option>
          </select>
          {errors.day && <p className="text-red-600 text-sm mt-1">{errors.day.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Heure de début</label>
            <input
              type="time"
              {...register("startTime")}
              className="w-full border rounded px-3 py-2"
            />
            {errors.startTime && <p className="text-red-600 text-sm mt-1">{errors.startTime.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Heure de fin</label>
            <input
              type="time"
              {...register("endTime")}
              className="w-full border rounded px-3 py-2"
            />
            {errors.endTime && <p className="text-red-600 text-sm mt-1">{errors.endTime.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Salle (optionnel)</label>
          <input
            type="text"
            {...register("room")}
            className="w-full border rounded px-3 py-2"
            placeholder="Ex: Salle 101"
          />
          {errors.room && <p className="text-red-600 text-sm mt-1">{errors.room.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ID Classe</label>
          <input
            type="text"
            {...register("classroomId")}
            className="w-full border rounded px-3 py-2"
          />
          {errors.classroomId && <p className="text-red-600 text-sm mt-1">{errors.classroomId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ID Matière</label>
          <input
            type="text"
            {...register("subjectId")}
            className="w-full border rounded px-3 py-2"
          />
          {errors.subjectId && <p className="text-red-600 text-sm mt-1">{errors.subjectId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ID Enseignant</label>
          <input
            type="text"
            {...register("teacherId")}
            className="w-full border rounded px-3 py-2"
          />
          {errors.teacherId && <p className="text-red-600 text-sm mt-1">{errors.teacherId.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Création..." : "Créer le créneau"}
        </Button>
      </form>
    </div>
  )
}
