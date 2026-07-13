"use client"

import { useState, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useParams } from "next/navigation"
import { updateClassroom, getSchoolGrades, getTracks, getClassroomById } from "@/lib/actions/classroom"
import { classroomUpdateSchema, type ClassroomUpdateInput } from "@/lib/validations/classroom"
import { Button } from "@/components/ui/button"

export default function EditClassroomPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string | undefined
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [schoolGrades, setSchoolGrades] = useState<Array<{ id: string; name: string; cycle: string; hasTracks: boolean }>>([])
  const [tracks, setTracks] = useState<Array<{ id: string; name: string }>>([])
  const [loadingData, setLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<ClassroomUpdateInput>({
    resolver: zodResolver(classroomUpdateSchema),
  })

  const schoolGradeId = useWatch({ control, name: "schoolGradeId" })

  // Fetch classroom data and school grades on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [classroomResult, gradesResult] = await Promise.all([
          getClassroomById(id!),
          getSchoolGrades(),
        ])

        if (classroomResult.success) {
          const classroom = classroomResult.data
          setValue("schoolGradeId", classroom.schoolGradeId)
          setValue("trackId", classroom.trackId || undefined)
          setValue("section", classroom.section)
          setValue("schoolYear", classroom.schoolYear)
          setValue("passingThreshold", classroom.passingThreshold)
        }

        if (gradesResult.success) {
          setSchoolGrades(gradesResult.data)
        }
      } catch {
        setError("Failed to load data")
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [id, setValue])

  // Fetch tracks when school grade changes
  useEffect(() => {
    const abort = { canceled: false }

    void Promise.resolve().then(async () => {
      if (!schoolGradeId) {
        if (!abort.canceled) {
          setTracks([])
          setValue("trackId", undefined)
        }
        return
      }

      const selectedGrade = schoolGrades.find((sg) => sg.id === schoolGradeId)
      if (selectedGrade?.hasTracks) {
        const result = await getTracks(schoolGradeId)
        if (!abort.canceled && result.success) {
          setTracks(result.data)
        }
      } else {
        if (!abort.canceled) {
          setTracks([])
          setValue("trackId", undefined)
        }
      }
    })

    return () => {
      abort.canceled = true
    }
  }, [schoolGradeId, schoolGrades, setValue])

  if (!id) {
    return <div className="p-8">ID non valide</div>
  }

  const onSubmit = async (data: ClassroomUpdateInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateClassroom(id!, data)

      if (result.success) {
        router.push(`/admin/academics/classrooms/${id}`)
      } else {
        setError(result.error || "Failed to update classroom")
      }
    } catch {
      setError("An error occurred. Please try again.")
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

  if (loadingData) {
    return <div className="p-8">Chargement...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Modifier la classe</h1>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="schoolGradeId" className="block text-sm font-medium text-gray-700 mb-2">
              Niveau
            </label>
            <select
              {...register("schoolGradeId")}
              id="schoolGradeId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Conserver le niveau actuel</option>
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
              <label htmlFor="trackId" className="block text-sm font-medium text-gray-700 mb-2">
                Série
              </label>
              <select
                {...register("trackId")}
                id="trackId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Conserver la série actuelle</option>
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

          <div>
            <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">
              Section
            </label>
            <input
              {...register("section")}
              type="text"
              id="section"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="A, B, 1, 2..."
            />
            {errors.section && (
              <p className="mt-1 text-sm text-red-600">{errors.section.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="schoolYear" className="block text-sm font-medium text-gray-700 mb-2">
              Année scolaire
            </label>
            <input
              {...register("schoolYear")}
              type="text"
              id="schoolYear"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="2025-2026"
            />
            {errors.schoolYear && (
              <p className="mt-1 text-sm text-red-600">{errors.schoolYear.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="passingThreshold" className="block text-sm font-medium text-gray-700 mb-2">
              Seuil de passage
            </label>
            <input
              {...register("passingThreshold", { valueAsNumber: true })}
              type="number"
              step="0.1"
              min={0}
              max={20}
              id="passingThreshold"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="10"
            />
            {errors.passingThreshold && (
              <p className="mt-1 text-sm text-red-600">{errors.passingThreshold.message}</p>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Modification..." : "Enregistrer"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
