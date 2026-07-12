"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createPeriod } from "@/lib/actions/period"
import type { PeriodInput } from "@/lib/validations/period"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewPeriodPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<PeriodInput>({
    name: "",
    order: 1,
    schoolYear: "2025-2026",
    examWeight: 0.6,
    dailyWeight: 0.4,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const result = await createPeriod(formData)

    if (result.success) {
      router.push("/admin/academics/periods")
    } else {
      setError(result.error)
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "number" ? parseFloat(e.target.value) : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link href="/admin/academics/periods" className="text-blue-600 hover:text-blue-800">
            ← Retour à la liste
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-6">Nouvelle période</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: Trimestre 1"
            />
          </div>

          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
              Ordre *
            </label>
            <input
              type="number"
              id="order"
              name="order"
              value={formData.order}
              onChange={handleChange}
              required
              min="1"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="schoolYear" className="block text-sm font-medium text-gray-700 mb-1">
              Année scolaire *
            </label>
            <input
              type="text"
              id="schoolYear"
              name="schoolYear"
              value={formData.schoolYear}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: 2025-2026"
            />
          </div>

          <div>
            <label htmlFor="examWeight" className="block text-sm font-medium text-gray-700 mb-1">
              Poids examen *
            </label>
            <input
              type="number"
              id="examWeight"
              name="examWeight"
              value={formData.examWeight}
              onChange={handleChange}
              required
              min="0"
              max="1"
              step="0.01"
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: 0.6"
            />
            <p className="text-xs text-gray-500 mt-1">Entre 0 et 1 (ex: 0.6 pour 60%)</p>
          </div>

          <div>
            <label htmlFor="dailyWeight" className="block text-sm font-medium text-gray-700 mb-1">
              Poids journalier *
            </label>
            <input
              type="number"
              id="dailyWeight"
              name="dailyWeight"
              value={formData.dailyWeight}
              onChange={handleChange}
              required
              min="0"
              max="1"
              step="0.01"
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: 0.4"
            />
            <p className="text-xs text-gray-500 mt-1">Entre 0 et 1 (ex: 0.4 pour 40%)</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer la période"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/academics/periods")}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
