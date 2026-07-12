"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams, useRouter } from "next/navigation"
import { getClassrooms, getStudentById, updateStudent } from "@/lib/actions/student"
import { studentFormSchema, type StudentFormInput, type StudentInput } from "@/lib/validations/student"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function EditStudentPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string | undefined
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [classrooms, setClassrooms] = useState<Array<{ id: string; name: string; schoolYear: string }>>([])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormInput>({
    resolver: zodResolver(studentFormSchema),
  })

  useEffect(() => {
    if (!id) {
      return
    }

    async function load() {
      if (!id) {
        return
      }

      const [studentResult, classroomsResult] = await Promise.all([getStudentById(id), getClassrooms()])

      if (studentResult.success) {
        const student = studentResult.data
        setValue("firstName", student.firstName)
        setValue("lastName", student.lastName)
        setValue("email", student.user.email)
        setValue("classroomId", student.classroom?.id)
        setValue("dateOfBirth", student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split("T")[0] : "")
        setValue("guardianName", student.guardianName ?? "")
        setValue("guardianPhone", student.guardianPhone ?? "")
      } else {
        setError(studentResult.error)
      }

      if (classroomsResult.success) {
        setClassrooms(classroomsResult.data)
      }

      setIsLoading(false)
    }

    load()
  }, [id, setValue])

  async function onSubmit(data: StudentFormInput) {
    if (!id) {
      return
    }

    setError(null)
    setIsLoading(true)

    const payload: StudentInput = {
      ...data,
      classroomId: data.classroomId || undefined,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      guardianName: data.guardianName || undefined,
      guardianPhone: data.guardianPhone || undefined,
    }
    const result = await updateStudent(id, payload)

    if (result.success) {
      router.push(`/admin/users/students/${id}`)
    } else {
      setError(result.error)
      setIsLoading(false)
    }
  }

  if (!id) {
    return <div className="p-8">ID non valide</div>
  }

  if (isLoading) {
    return <div className="p-8">Chargement...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Modifier l'élève</h1>
        <p className="text-gray-600 mt-2">Mettre à jour les informations de l'élève</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" {...register("firstName")} className="mt-1" />
              {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>}
            </div>

            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" {...register("lastName")} className="mt-1" />
              {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} className="mt-1" />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfBirth">Date de naissance</Label>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} className="mt-1" />
              {errors.dateOfBirth && <p className="text-sm text-red-600 mt-1">{errors.dateOfBirth.message}</p>}
            </div>

            <div>
              <Label htmlFor="guardianName">Nom du responsable</Label>
              <Input id="guardianName" {...register("guardianName")} className="mt-1" />
              {errors.guardianName && <p className="text-sm text-red-600 mt-1">{errors.guardianName.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="guardianPhone">Téléphone du responsable</Label>
            <Input id="guardianPhone" {...register("guardianPhone")} className="mt-1" />
            {errors.guardianPhone && <p className="text-sm text-red-600 mt-1">{errors.guardianPhone.message}</p>}
          </div>

          <div>
            <Label htmlFor="classroomId">Classe (optionnel)</Label>
            <select
              id="classroomId"
              {...register("classroomId")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            >
              <option value="">Non assigné</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} ({classroom.schoolYear})
                </option>
              ))}
            </select>
            {errors.classroomId && <p className="text-sm text-red-600 mt-1">{errors.classroomId.message}</p>}
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
