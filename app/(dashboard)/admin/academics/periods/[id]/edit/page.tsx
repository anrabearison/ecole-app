"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { getPeriodById, updatePeriod } from "@/lib/actions/period"
import type { PeriodInput } from "@/lib/validations/period"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ConfirmActionButton } from "@/components/ConfirmDialog"
import { ArrowLeft } from "lucide-react"

export default function EditPeriodPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodNotFound, setPeriodNotFound] = useState(false)

  const [formData, setFormData] = useState<PeriodInput>({
    name: "",
    order: 1,
    schoolYear: "2025-2026",
    examWeight: 0.6,
    dailyWeight: 0.4,
  })

  useEffect(() => {
    async function loadPeriod() {
      try {
        const result = await getPeriodById(resolvedParams.id)
        if (result.success) {
          setFormData({
            name: result.data.name,
            order: result.data.order,
            schoolYear: result.data.schoolYear,
            examWeight: result.data.examWeight,
            dailyWeight: result.data.dailyWeight,
          })
        } else {
          setPeriodNotFound(true)
        }
      } catch (err) {
        setPeriodNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    loadPeriod()
  }, [resolvedParams.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const result = await updatePeriod(resolvedParams.id, formData)

    if (result.success) {
      router.push(`/admin/academics/periods/${resolvedParams.id}`)
    } else {
      setError(result.error)
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "number" ? parseFloat(e.target.value) : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (periodNotFound) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <Link href="/admin/academics/periods" className="text-blue-600 hover:text-blue-800">
              ← Retour à la liste
            </Link>
          </div>
          <div className="bg-red-50 border border-red-200 rounded text-red-800 p-4">
            Période non trouvée
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link href={`/admin/academics/periods/${resolvedParams.id}`} className="text-blue-600 hover:text-blue-800">
            ← Retour aux détails
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-6">Modifier la période</h1>

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
            <ConfirmActionButton
              type="submit"
              variant="update"
              btnVariant="default"
              title="Confirmation de modification"
              message="Êtes-vous sûr de vouloir modifier cette période scolaire ?"
              confirmLabel="Oui, modifier"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Modification..." : "Enregistrer"}
            </ConfirmActionButton>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/academics/periods/${resolvedParams.id}`)}
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
