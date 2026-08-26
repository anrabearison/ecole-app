"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams, useRouter } from "next/navigation"
import { getTeacherById, updateTeacher } from "@/lib/actions/teacher"
import { teacherFormSchema, type TeacherFormInput, type TeacherUpdateInput } from "@/lib/validations/teacher"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function EditTeacherPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string | undefined
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormInput>({
    resolver: zodResolver(teacherFormSchema),
  })

  useEffect(() => {
    if (!id) {
      return
    }

    async function load() {
      if (!id) {
        return
      }

      const result = await getTeacherById(id)

      if (result.success) {
        const teacher = result.data
        setValue("firstName", teacher.firstName)
        setValue("lastName", teacher.lastName)
        setValue("email", teacher.user.email)
        setValue("phone", teacher.phone ?? "")
        setValue("contractType", teacher.contractType ?? "")
        setValue("registrationNumber", teacher.registrationNumber ?? "")
        setValue("nationalIdNumber", teacher.nationalIdNumber)
        setValue("sex", teacher.sex as "MALE" | "FEMALE")
      } else {
        setError(result.error)
      }

      setIsLoading(false)
    }

    load()
  }, [id, setValue])

  async function onSubmit(data: TeacherFormInput) {
    if (!id) {
      return
    }

    setError(null)
    setIsLoading(true)

    const payload: TeacherUpdateInput = {
      ...data,
      phone: data.phone || undefined,
      contractType: data.contractType || undefined,
      registrationNumber: data.registrationNumber || undefined,
    }
    const result = await updateTeacher(id, payload)

    if (result.success) {
      router.push(`/admin/users/teachers/${id}`)
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
        <h1 className="text-3xl font-bold text-gray-900">Modifier l'enseignant</h1>
        <p className="text-gray-600 mt-2">Mettre à jour les informations de l'enseignant</p>
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
              <Label htmlFor="registrationNumber">Numéro matricule</Label>
              <Input id="registrationNumber" {...register("registrationNumber")} className="mt-1" />
              {errors.registrationNumber && <p className="text-sm text-red-600 mt-1">{errors.registrationNumber.message}</p>}
            </div>

            <div>
              <Label htmlFor="nationalIdNumber">Numéro CIN</Label>
              <Input id="nationalIdNumber" {...register("nationalIdNumber")} className="mt-1" />
              {errors.nationalIdNumber && <p className="text-sm text-red-600 mt-1">{errors.nationalIdNumber.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sex">Sexe</Label>
              <select
                id="sex"
                {...register("sex")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              >
                <option value="">Sélectionner</option>
                <option value="MALE">Masculin</option>
                <option value="FEMALE">Féminin</option>
              </select>
              {errors.sex && <p className="text-sm text-red-600 mt-1">{errors.sex.message}</p>}
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" {...register("phone")} className="mt-1" />
              {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="contractType">Type de contrat</Label>
            <Input id="contractType" {...register("contractType")} className="mt-1" />
            {errors.contractType && <p className="text-sm text-red-600 mt-1">{errors.contractType.message}</p>}
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
