"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSchool } from "@/lib/actions/school"
import type { SchoolInput } from "@/lib/validations/school"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewSchoolPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const [formData, setFormData] = useState<SchoolInput>({
    name: "",
    address: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    setTempPassword(null)

    const result = await createSchool(formData)

    if (result.success) {
      setSuccess(true)
      setTempPassword(result.data.tempPassword)
    } else {
      setError(result.error)
    }

    setIsSubmitting(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  if (success && tempPassword) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">École créée avec succès</h1>
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
            <p className="text-green-800 font-medium mb-2">Mot de passe temporaire de l'admin :</p>
            <p className="text-green-900 text-lg font-mono bg-white p-2 rounded border">{tempPassword}</p>
            <p className="text-green-700 text-sm mt-2">
              Conservez ce mot de passe. L'admin devra le changer lors de sa première connexion.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/platform")}>Retour à la liste</Button>
            <Button variant="outline" onClick={() => {
              setSuccess(false)
              setTempPassword(null)
              setFormData({
                name: "",
                address: "",
                adminFirstName: "",
                adminLastName: "",
                adminEmail: "",
              })
            }}>
              Créer une autre école
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link href="/platform" className="text-blue-600 hover:text-blue-800">
            ← Retour à la liste
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-6">Nouvelle école</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'école *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: Sekoly Test"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: Amboavory"
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h2 className="text-lg font-medium mb-4">Administrateur de l'école</h2>

            <div>
              <label htmlFor="adminFirstName" className="block text-sm font-medium text-gray-700 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                id="adminFirstName"
                name="adminFirstName"
                value={formData.adminFirstName}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="adminLastName" className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                id="adminLastName"
                name="adminLastName"
                value={formData.adminLastName}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="adminEmail"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="admin@ecole.mg"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer l'école"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/platform")}
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
