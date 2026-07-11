"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createTrack } from "@/lib/actions/track"
import { listSchoolGrades } from "@/lib/actions/school-grade"
import { trackSchema, type TrackInput } from "@/lib/validations/track"
import { Button } from "@/components/ui/button"

export default function NewTrackPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schoolGrades, setSchoolGrades] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackInput>({
    resolver: zodResolver(trackSchema),
  })

  useEffect(() => {
    async function loadSchoolGrades() {
      const result = await listSchoolGrades()
      if (result.success) {
        // Filter to only HIGH_SCHOOL grades (Lycée) as per requirements
        setSchoolGrades(result.data.filter(g => g.cycle === "HIGH_SCHOOL"))
      }
    }
    loadSchoolGrades()
  }, [])

  const onSubmit = async (data: TrackInput) => {
    setIsSubmitting(true)
    setError(null)

    const result = await createTrack(data)

    if (result.success) {
      router.push("/admin/academics/tracks")
    } else {
      setError(result.error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Créer une série</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom</label>
          <input
            type="text"
            {...register("name")}
            className="w-full border rounded px-3 py-2"
            placeholder="Ex: A, C, D, OSE"
          />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Niveau scolaire</label>
          <select
            {...register("schoolGradeId")}
            className="w-full border rounded px-3 py-2"
            disabled={schoolGrades.length === 0}
          >
            {schoolGrades.length === 0 ? (
              <option value="">Aucun niveau de lycée disponible</option>
            ) : (
              <>
                <option value="">Sélectionner un niveau</option>
                {schoolGrades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </>
            )}
          </select>
          {errors.schoolGradeId && <p className="text-red-600 text-sm mt-1">{errors.schoolGradeId.message}</p>}
          <p className="text-gray-500 text-sm mt-1">Les séries sont utilisées pour les niveaux de lycée (à partir de Première)</p>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting || schoolGrades.length === 0}>
            {isSubmitting ? "Création..." : "Créer la série"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  )
}
