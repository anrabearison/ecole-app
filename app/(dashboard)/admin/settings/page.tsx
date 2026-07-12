"use client"

import { useState } from "react"
import { updateSchoolWeighting } from "@/lib/actions/school"
import type { SchoolWeightingInput } from "@/lib/validations/school"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<SchoolWeightingInput>({
    examWeight: 0.6,
    dailyWeight: 0.4,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    const result = await updateSchoolWeighting(formData)

    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error)
    }

    setIsSubmitting(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setFormData({ ...formData, [e.target.name]: value })
  }

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Paramètres de l'école</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-800">
            Paramètres mis à jour avec succès
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="examWeight" className="block text-sm font-medium text-gray-700 mb-1">
              Poids des examens (0-1)
            </label>
            <input
              type="number"
              id="examWeight"
              name="examWeight"
              value={formData.examWeight}
              onChange={handleChange}
              step="0.1"
              min="0"
              max="1"
              required
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Exemple: 0.6 signifie 60% du poids pour les examens
            </p>
          </div>

          <div>
            <label htmlFor="dailyWeight" className="block text-sm font-medium text-gray-700 mb-1">
              Poids des notes journalières (0-1)
            </label>
            <input
              type="number"
              id="dailyWeight"
              name="dailyWeight"
              value={formData.dailyWeight}
              onChange={handleChange}
              step="0.1"
              min="0"
              max="1"
              required
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Exemple: 0.4 signifie 40% du poids pour les notes journalières
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> La somme des deux poids doit être égale à 1.0 (100%).
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Actuel: {(formData.examWeight + formData.dailyWeight).toFixed(2)}
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
          </Button>
        </form>
      </div>
    </div>
  )
}
