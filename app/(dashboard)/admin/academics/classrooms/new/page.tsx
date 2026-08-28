"use client"

import { useState, useEffect } from "react"
import { useForm, useWatch, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClassroom, getSchoolGrades, getTracks } from "@/lib/actions/classroom"
import { listTeachers } from "@/lib/actions/teacher"
import { classroomSchema, type ClassroomInput } from "@/lib/validations/classroom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmActionButton } from "@/components/ConfirmDialog"
import { ArrowLeft, School, UserCheck, AlertTriangle } from "lucide-react"

export default function NewClassroomPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [schoolGrades, setSchoolGrades] = useState<Array<{ id: string; name: string; cycle: string; hasTracks: boolean }>>([])
  const [tracks, setTracks] = useState<Array<{ id: string; name: string }>>([])
  const [teachers, setTeachers] = useState<Array<{ id: string; firstName: string | null; lastName: string }>>([])

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ClassroomInput>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      schoolYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      passingThreshold: 10,
      homeroomTeacherIds: [],
    }
  })

  const schoolGradeId = useWatch({ control, name: "schoolGradeId" })

  // Fetch school grades on mount
  useEffect(() => {
    getSchoolGrades().then((result) => {
      if (result.success) {
        setSchoolGrades(result.data)
      }
    })
  }, [])

  // Fetch teachers on mount
  useEffect(() => {
    listTeachers().then((result) => {
      if (result.success) {
        setTeachers(result.data)
      }
    })
  }, [])

  // Fetch tracks when school grade changes
  useEffect(() => {
    let isActive = true

    async function updateTracks() {
      if (!schoolGradeId) {
        if (isActive) {
          setTracks([])
          setValue("trackId", undefined)
        }
        return
      }

      const selectedGrade = schoolGrades.find((sg) => sg.id === schoolGradeId)

      if (!selectedGrade?.hasTracks) {
        if (isActive) {
          setTracks([])
          setValue("trackId", undefined)
        }
        return
      }

      const result = await getTracks(schoolGradeId)
      if (!isActive) return

      if (result.success) {
        setTracks(result.data)
      }
    }

    void updateTracks()

    return () => {
      isActive = false
    }
  }, [schoolGradeId, schoolGrades, setValue])

  const onSubmit: SubmitHandler<ClassroomInput> = async (data) => {
    setIsLoading(true)
    setError(null)

    try {
      const cleanedData = {
        ...data,
        trackId: (!data.trackId || data.trackId === "$undefined") ? undefined : data.trackId,
        homeroomTeacherIds: data.homeroomTeacherIds || [],
      }
      const result = await createClassroom(cleanedData as ClassroomInput)

      if (result.success) {
        router.push("/admin/academics/classrooms")
      } else {
        setError(result.error || "Échec de la création de la classe")
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedGrade = schoolGrades.find((sg) => sg.id === schoolGradeId)
  const showTrackField = selectedGrade?.hasTracks

  const cycleNames: Record<string, string> = {
    PRIMARY: "Primaire",
    MIDDLE_SCHOOL: "Collège",
    HIGH_SCHOOL: "Lycée",
  }

  const currentYear = new Date().getFullYear()
  const schoolYearOptions = [
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
    `${currentYear + 2}-${currentYear + 3}`,
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/admin/academics/classrooms"
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-2 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste des classes</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Nouvelle classe</h1>
        <p className="text-gray-600 mt-1">Créer une nouvelle classe d'enseignement pour l'école.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Niveau & Structure */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Niveau & Structure</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="schoolGradeId" className="font-medium text-gray-700">
                  Niveau d'étude <span className="text-red-500">*</span>
                </Label>
                <select
                  {...register("schoolGradeId")}
                  id="schoolGradeId"
                  className="mt-1.5 block w-full rounded-md border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white"
                >
                  <option value="">Sélectionner un niveau</option>
                  {schoolGrades.map((sg) => (
                    <option key={sg.id} value={sg.id}>
                      {cycleNames[sg.cycle] || sg.cycle} - {sg.name}
                    </option>
                  ))}
                </select>
                {errors.schoolGradeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.schoolGradeId.message}</p>
                )}
              </div>

              {showTrackField && (
                <div>
                  <Label htmlFor="trackId" className="font-medium text-gray-700">
                    Série (Filière) <span className="text-red-500">*</span>
                  </Label>
                  <select
                    {...register("trackId")}
                    id="trackId"
                    className="mt-1.5 block w-full rounded-md border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white"
                  >
                    <option value="">Sélectionner une série</option>
                    {tracks.map((track) => (
                      <option key={track.id} value={track.id}>
                        Série {track.name}
                      </option>
                    ))}
                  </select>
                  {errors.trackId && (
                    <p className="mt-1 text-sm text-red-600">{errors.trackId.message}</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="section" className="font-medium text-gray-700">
                  Section / Numéro <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("section")}
                  id="section"
                  className="mt-1.5"
                  placeholder="Ex: A, B, 1, 2..."
                />
                {errors.section && (
                  <p className="mt-1 text-sm text-red-600">{errors.section.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="schoolYear" className="font-medium text-gray-700">
                  Année scolaire <span className="text-red-500">*</span>
                </Label>
                <select
                  {...register("schoolYear")}
                  id="schoolYear"
                  className="mt-1.5 block w-full rounded-md border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white"
                >
                  {schoolYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.schoolYear && (
                  <p className="mt-1 text-sm text-red-600">{errors.schoolYear.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Encadrement & Évaluation */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Encadrement & Évaluation</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <Label className="font-medium text-gray-700">
                Professeurs principaux <span className="text-gray-400 font-normal">(Optionnel)</span>
              </Label>
              <p className="text-xs text-gray-500 mt-1 mb-3">Sélectionnez un ou plusieurs enseignants responsables de cette classe</p>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                {teachers.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun enseignant disponible</p>
                ) : (
                  teachers.map((teacher) => (
                    <label key={teacher.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        {...register("homeroomTeacherIds")}
                        value={teacher.id}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">
                        {teacher.firstName ? `${teacher.firstName} ${teacher.lastName}` : teacher.lastName}
                      </span>
                    </label>
                  ))
                )}
              </div>
              {errors.homeroomTeacherIds && (
                <p className="mt-1 text-sm text-red-600">{errors.homeroomTeacherIds.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="passingThreshold" className="font-medium text-gray-700">
                  Seuil de passage (Moyenne minimale / 20)
                </Label>
                <Input
                  {...register("passingThreshold", { valueAsNumber: true })}
                  type="number"
                  step="0.1"
                  min={0}
                  max={20}
                  id="passingThreshold"
                  className="mt-1.5 font-mono"
                  placeholder="10"
                  defaultValue={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Moyenne minimale requise pour délibérer le passage de l'élève.
                </p>
                {errors.passingThreshold && (
                  <p className="mt-1 text-sm text-red-600">{errors.passingThreshold.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <ConfirmActionButton
            type="submit"
            variant="create"
            btnVariant="default"
            title="Confirmation d'enregistrement"
            message="Êtes-vous sûr de vouloir créer cette nouvelle classe ?"
            confirmLabel="Oui, enregistrer"
            disabled={isLoading}
            className="min-w-[140px]"
          >
            {isLoading ? "Création..." : "Créer la classe"}
          </ConfirmActionButton>
        </div>
      </form>
    </div>
  )
}
