"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createTeacher } from "@/lib/actions/teacher"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { teacherSchema, type TeacherInput } from "@/lib/validations/teacher"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewTeacherPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const [teacherEmail, setTeacherEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TeacherInput>({
    resolver: zodResolver(teacherSchema),
  })

  async function onSubmit(data: TeacherInput) {
    setError(null)
    const result = await createTeacher(data)

    if (result.success) {
      setTemporaryPassword(result.data.temporaryPassword)
      setTeacherEmail(data.email)
      setShowPasswordModal(true)
      reset()
    } else {
      setError(result.error)
    }
  }

  function handlePasswordModalClose() {
    setShowPasswordModal(false)
    setTemporaryPassword(null)
    setTeacherEmail(null)
    router.push("/admin/users/teachers")
    router.refresh()
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Nouvel enseignant</h1>
        <p className="text-gray-600 mt-2">Créer un nouvel enseignant dans l'école</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                {...register("firstName")}
                className="mt-1"
              />
              {errors.firstName && (
                <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                {...register("lastName")}
                className="mt-1"
              />
              {errors.lastName && (
                <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              className="mt-1"
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer l'enseignant"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>

      {/* Temporary Password Modal */}
      {showPasswordModal && temporaryPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Compte créé avec succès</h2>
              <p className="text-gray-600 mt-2">
                Le compte de l'enseignant a été créé. Voici le mot de passe temporaire :
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">Email : {teacherEmail}</p>
              <div className="flex items-center gap-2">
                <Input
                  value={temporaryPassword}
                  readOnly
                  className="font-mono text-lg"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(temporaryPassword)
                  }}
                >
                  Copier
                </Button>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-700">
                ⚠️ Important : Ce mot de passe ne sera plus affiché. Copiez-le maintenant et transmettez-le à l'enseignant.
              </p>
            </div>

            <Button onClick={handlePasswordModalClose} className="w-full">
              J'ai copié le mot de passe
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
