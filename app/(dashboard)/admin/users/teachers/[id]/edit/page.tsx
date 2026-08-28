"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getTeacherById, updateTeacher } from "@/lib/actions/teacher"
import { teacherFormSchema, type TeacherFormInput, type TeacherUpdateInput } from "@/lib/validations/teacher"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmActionButton } from "@/components/ConfirmDialog"
import { Skeleton } from "@/components/Skeleton"
import { useToast } from "@/components/Toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, User, Briefcase, KeyRound, AlertTriangle } from "lucide-react"

export default function EditTeacherPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string | undefined
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  // Fetch teacher data using TanStack Query
  const { data: teacher, isLoading: isLoadingTeacher, isError: isTeacherError } = useQuery({
    queryKey: ["teacher", id],
    queryFn: async () => {
      if (!id) throw new Error("ID manquant")
      const result = await getTeacherById(id)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!id,
  })

  const isLoading = isLoadingTeacher

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormInput>({
    resolver: zodResolver(teacherFormSchema),
  })

  const selectedSex = watch("sex")
  const selectedContract = watch("contractType")

  // Populate form when teacher data is loaded
  useEffect(() => {
    if (teacher) {
      setValue("firstName", teacher.firstName || "")
      setValue("lastName", teacher.lastName)
      setValue("email", teacher.user.email || "")
      setValue("phone", teacher.phone ?? "")
      setValue("contractType", (teacher.contractType as "FONCTIONNAIRE" | "ENF" | undefined) ?? undefined)
      setValue("registrationNumber", teacher.registrationNumber ?? "")
      setValue("nationalIdNumber", teacher.nationalIdNumber)
      if (teacher.sex) setValue("sex", teacher.sex as "MALE" | "FEMALE")
    }
  }, [teacher, setValue])

  // Update teacher using TanStack Query mutation
  const updateTeacherMutation = useMutation({
    mutationFn: (data: TeacherUpdateInput) => {
      if (!id) throw new Error("ID manquant")
      return updateTeacher(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher", id] })
      showToast('success', 'Enseignant modifié avec succès')
      router.push(`/admin/users/teachers/${id}`)
    },
    onError: (error: Error) => {
      setError(error.message)
      showToast('error', error.message)
    },
  })

  async function onSubmit(data: TeacherFormInput) {
    if (!id) return

    setError(null)

    const cleanEmail = data.email && data.email.trim() !== "" ? data.email.trim() : undefined
    const payload: TeacherUpdateInput = {
      ...data,
      email: cleanEmail,
      phone: data.phone || undefined,
      contractType: data.contractType || undefined,
      registrationNumber: data.registrationNumber || undefined,
    }
    updateTeacherMutation.mutate(payload)
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

  if (isTeacherError) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors du chargement de l'enseignant
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href={`/admin/users/teachers/${id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-2 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la fiche de l'enseignant</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Modifier l'enseignant</h1>
        <p className="text-gray-600 mt-1">Mettre à jour les informations et coordonnées de l'enseignant.</p>
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
                  Prénom <span className="text-gray-400 font-normal">(Optionnel)</span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Sexe : Segmented Control Buttons */}
              <div>
                <Label className="font-medium text-gray-700 block mb-2">
                  Sexe <span className="text-gray-400 font-normal">(Optionnel)</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
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

              <div>
                <Label htmlFor="phone" className="font-medium text-gray-700">
                  Téléphone <span className="text-gray-400 font-normal">(Optionnel)</span>
                </Label>
                <Input id="phone" {...register("phone")} className="mt-1.5" />
                {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Statut & Identification */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Statut & Identification</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="nationalIdNumber" className="font-medium text-gray-700">
                  Numéro CIN <span className="text-red-500">*</span>
                </Label>
                <Input id="nationalIdNumber" {...register("nationalIdNumber")} className="mt-1.5 font-mono" />
                {errors.nationalIdNumber && <p className="text-sm text-red-600 mt-1">{errors.nationalIdNumber.message}</p>}
              </div>

              <div>
                <Label htmlFor="registrationNumber" className="font-medium text-gray-700">
                  Numéro matricule interne <span className="text-gray-400 font-normal">(Optionnel)</span>
                </Label>
                <Input id="registrationNumber" {...register("registrationNumber")} className="mt-1.5 font-mono" />
                {errors.registrationNumber && <p className="text-sm text-red-600 mt-1">{errors.registrationNumber.message}</p>}
              </div>
            </div>

            {/* Type de contrat : Segmented Control */}
            <div>
              <Label className="font-medium text-gray-700 block mb-2">
                Type de contrat <span className="text-gray-400 font-normal">(Optionnel)</span>
              </Label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setValue("contractType", "FONCTIONNAIRE", { shouldValidate: true })}
                  className={`px-4 py-2.5 rounded-lg border font-medium text-sm transition-all ${
                    selectedContract === "FONCTIONNAIRE"
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs ring-1 ring-indigo-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Fonctionnaire
                </button>
                <button
                  type="button"
                  onClick={() => setValue("contractType", "ENF", { shouldValidate: true })}
                  className={`px-4 py-2.5 rounded-lg border font-medium text-sm transition-all ${
                    selectedContract === "ENF"
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs ring-1 ring-indigo-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  ENF
                </button>
              </div>
              {errors.contractType && <p className="text-sm text-red-600 mt-1">{errors.contractType.message}</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Compte d'accès */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Compte d'accès</h2>
          </div>
          <div className="p-6">
            <div>
              <Label htmlFor="email" className="font-medium text-gray-700">
                Email professionnel <span className="text-gray-400 font-normal">(Optionnel)</span>
              </Label>
              <Input id="email" type="email" {...register("email")} className="mt-1.5" />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
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
            message="Êtes-vous sûr de vouloir enregistrer les modifications apportées à cet enseignant ?"
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
