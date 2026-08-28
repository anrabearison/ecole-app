"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getClassrooms, getStudentById, updateStudent } from "@/lib/actions/student"
import { studentFormSchema, type StudentFormInput, type StudentInput } from "@/lib/validations/student"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmActionButton } from "@/components/ConfirmDialog"
import { Skeleton } from "@/components/Skeleton"
import { useToast } from "@/components/Toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, User, GraduationCap, Users, AlertTriangle } from "lucide-react"

export default function EditStudentPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string | undefined
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  // Fetch student data using TanStack Query
  const { data: student, isLoading: isLoadingStudent, isError: isStudentError } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      if (!id) throw new Error("ID manquant")
      const result = await getStudentById(id)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!id,
  })

  // Fetch classrooms using TanStack Query
  const { data: classrooms = [], isLoading: isLoadingClassrooms } = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const result = await getClassrooms()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const isLoading = isLoadingStudent || isLoadingClassrooms

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormInput>({
    resolver: zodResolver(studentFormSchema),
  })

  const selectedSex = watch("sex")

  // Populate form when student data is loaded
  useEffect(() => {
    if (student) {
      setValue("firstName", student.firstName)
      setValue("lastName", student.lastName)
      setValue("email", student.user.email || "")
      setValue("classroomId", student.classroom?.id)
      setValue("dateOfBirth", student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split("T")[0] : "")
      setValue("guardianName", student.guardianName ?? "")
      setValue("guardianPhone", student.guardianPhone ?? "")
      setValue("registrationNumber", student.registrationNumber)
      setValue("sex", student.sex as "MALE" | "FEMALE")
      setValue("status", student.status as "PASSING" | "REPEATING" | "TRIPLING")
      setValue("placeOfBirth", student.placeOfBirth ?? "")
    }
  }, [student, setValue])

  // Update student using TanStack Query mutation
  const updateStudentMutation = useMutation({
    mutationFn: (data: StudentInput) => {
      if (!id) throw new Error("ID manquant")
      return updateStudent(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", id] })
      showToast('success', 'Élève modifié avec succès')
      router.push(`/admin/users/students/${id}`)
    },
    onError: (error: Error) => {
      setError(error.message)
      showToast('error', error.message)
    },
  })

  async function onSubmit(data: StudentFormInput) {
    if (!id) return

    setError(null)

    const cleanEmail = data.email && data.email.trim() !== "" ? data.email.trim() : undefined
    const payload: StudentInput = {
      ...data,
      email: cleanEmail,
      classroomId: data.classroomId || undefined,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      guardianName: data.guardianName || undefined,
      guardianPhone: data.guardianPhone || undefined,
      status: data.status || "PASSING",
    }
    updateStudentMutation.mutate(payload)
  }

  if (!id) {
    return <div className="p-8">ID non valide</div>
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  if (isStudentError) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors du chargement de l'élève
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href={`/admin/users/students/${id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-2 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la fiche de l'élève</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Modifier l'élève</h1>
        <p className="text-gray-600 mt-1">Mettre à jour les informations et la scolarité de l'élève.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Informations personnelles */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Informations personnelles</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="firstName" className="font-medium text-gray-700">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input id="firstName" {...register("firstName")} className="mt-1.5" />
                {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>}
              </div>

              <div>
                <Label htmlFor="lastName" className="font-medium text-gray-700">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input id="lastName" {...register("lastName")} className="mt-1.5" />
                {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Sexe : Segmented Control Buttons */}
            <div>
              <Label className="font-medium text-gray-700 block mb-2">
                Sexe <span className="text-gray-400 font-normal">(Optionnel)</span>
              </Label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setValue("sex", "MALE", { shouldValidate: true })}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium text-sm transition-all ${
                    selectedSex === "MALE"
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs ring-1 ring-indigo-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">♂️</span>
                  <span>Masculin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("sex", "FEMALE", { shouldValidate: true })}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium text-sm transition-all ${
                    selectedSex === "FEMALE"
                      ? "bg-pink-50 border-pink-600 text-pink-700 shadow-xs ring-1 ring-pink-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">♀️</span>
                  <span>Féminin</span>
                </button>
              </div>
              {errors.sex && <p className="text-sm text-red-600 mt-1">{errors.sex.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="dateOfBirth" className="font-medium text-gray-700">
                  Date de naissance
                </Label>
                <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} className="mt-1.5" />
                {errors.dateOfBirth && <p className="text-sm text-red-600 mt-1">{errors.dateOfBirth.message}</p>}
              </div>

              <div>
                <Label htmlFor="placeOfBirth" className="font-medium text-gray-700">
                  Lieu de naissance
                </Label>
                <Input id="placeOfBirth" {...register("placeOfBirth")} className="mt-1.5" />
                {errors.placeOfBirth && <p className="text-sm text-red-600 mt-1">{errors.placeOfBirth.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Scolarité & Compte d'accès */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Scolarité & Compte d'accès</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="registrationNumber" className="font-medium text-gray-700">
                  Numéro matricule <span className="text-red-500">*</span>
                </Label>
                <Input id="registrationNumber" {...register("registrationNumber")} className="mt-1.5 font-mono" />
                {errors.registrationNumber && <p className="text-sm text-red-600 mt-1">{errors.registrationNumber.message}</p>}
              </div>

              <div>
                <Label htmlFor="status" className="font-medium text-gray-700">
                  Statut scolaire
                </Label>
                <select
                  id="status"
                  {...register("status")}
                  className="mt-1.5 block w-full rounded-md border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white"
                >
                  <option value="PASSING">Passant</option>
                  <option value="REPEATING">Redoublant</option>
                  <option value="TRIPLING">Triplant</option>
                </select>
                {errors.status && <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="classroomId" className="font-medium text-gray-700">
                  Classe assignée
                </Label>
                <select
                  id="classroomId"
                  {...register("classroomId")}
                  className="mt-1.5 block w-full rounded-md border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white"
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

              <div>
                <Label htmlFor="email" className="font-medium text-gray-700">
                  Email <span className="text-gray-400 font-normal">(Optionnel)</span>
                </Label>
                <Input id="email" type="email" {...register("email")} className="mt-1.5" />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Responsable légal / Tuteur */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Responsable légal / Tuteur</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="guardianName" className="font-medium text-gray-700">
                  Nom du tuteur
                </Label>
                <Input id="guardianName" {...register("guardianName")} className="mt-1.5" />
                {errors.guardianName && <p className="text-sm text-red-600 mt-1">{errors.guardianName.message}</p>}
              </div>

              <div>
                <Label htmlFor="guardianPhone" className="font-medium text-gray-700">
                  Téléphone du tuteur
                </Label>
                <Input id="guardianPhone" {...register("guardianPhone")} className="mt-1.5" />
                {errors.guardianPhone && <p className="text-sm text-red-600 mt-1">{errors.guardianPhone.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <ConfirmActionButton
            type="submit"
            variant="update"
            btnVariant="default"
            title="Confirmation de modification"
            message="Êtes-vous sûr de vouloir enregistrer les modifications apportées à cet élève ?"
            confirmLabel="Oui, modifier"
            disabled={isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </ConfirmActionButton>
        </div>
      </form>
    </div>
  )
}
