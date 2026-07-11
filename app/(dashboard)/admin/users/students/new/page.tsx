"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createStudent, getClassrooms } from "@/lib/actions/student"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { studentSchema, type StudentInput } from "@/lib/validations/student"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewStudentPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [classrooms, setClassrooms] = useState<Array<{ id: string; name: string; schoolYear: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const [studentEmail, setStudentEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
  })

  useEffect(() => {
    async function fetchClassrooms() {
      const result = await getClassrooms()
      if (result.success) {
        setClassrooms(result.data)
      }
      setIsLoading(false)
    }
    fetchClassrooms()
  }, [])

  async function onSubmit(data: StudentInput) {
    setError(null)
    const result = await createStudent(data)

    if (result.success) {
      setTemporaryPassword(result.data.temporaryPassword)
      setStudentEmail(data.email)
      setShowPasswordModal(true)
      reset()
    } else {
      setError(result.error)
    }
  }

  function handlePasswordModalClose() {
    setShowPasswordModal(false)
    setTemporaryPassword(null)
    setStudentEmail(null)
    router.push("/admin/users/students")
    router.refresh()
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Nouvel élève</h1>
        <p className="text-gray-600 mt-2">Créer un nouvel élève dans l'école</p>
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

          <div>
            <Label htmlFor="classroomId">Classe (optionnel)</Label>
            <select
              id="classroomId"
              {...register("classroomId")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              disabled={isLoading}
            >
              <option value="">Non assigné</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} ({classroom.schoolYear})
                </option>
              ))}
            </select>
            {errors.classroomId && (
              <p className="text-sm text-red-600 mt-1">{errors.classroomId.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer l'élève"}
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
                Le compte de l'élève a été créé. Voici le mot de passe temporaire :
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">Email : {studentEmail}</p>
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
                ⚠️ Important : Ce mot de passe ne sera plus affiché. Copiez-le maintenant et transmettez-le à l'élève.
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
