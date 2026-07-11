"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createSchoolGrade } from "@/lib/actions/school-grade"
import { schoolGradeSchema, type SchoolGradeInput } from "@/lib/validations/school-grade"
import { Button } from "@/components/ui/button"

export default function NewSchoolGradePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SchoolGradeInput>({
    resolver: zodResolver(schoolGradeSchema),
  })

  const onSubmit = async (data: SchoolGradeInput) => {
    setIsSubmitting(true)
    setError(null)

    const result = await createSchoolGrade(data)

    if (result.success) {
      router.push("/admin/academics/grades")
    } else {
      setError(result.error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Créer un niveau scolaire</h1>

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
            placeholder="Ex: 6ème, Seconde, Première"
          />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cycle</label>
          <select
            {...register("cycle")}
            className="w-full border rounded px-3 py-2"
          >
            <option value="PRIMARY">Primaire</option>
            <option value="MIDDLE_SCHOOL">Collège</option>
            <option value="HIGH_SCHOOL">Lycée</option>
          </select>
          {errors.cycle && <p className="text-red-600 text-sm mt-1">{errors.cycle.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ordre</label>
          <input
            type="number"
            {...register("order", { valueAsNumber: true })}
            className="w-full border rounded px-3 py-2"
            placeholder="Ex: 1, 2, 3"
          />
          {errors.order && <p className="text-red-600 text-sm mt-1">{errors.order.message}</p>}
          <p className="text-gray-500 text-sm mt-1">Utilisé pour trier les niveaux logiquement (ex: 6ème = 1, 5ème = 2, etc.)</p>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Création..." : "Créer le niveau"}
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
