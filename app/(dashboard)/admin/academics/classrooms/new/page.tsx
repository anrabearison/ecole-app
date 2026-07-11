"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { createClassroom, getSchoolGrades, getTracks } from "@/lib/actions/classroom"
import { classroomSchema, type ClassroomInput } from "@/lib/validations/classroom"
import { Button } from "@/components/ui/button"

export default function NewClassroomPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [schoolGrades, setSchoolGrades] = useState<Array<{ id: string; name: string; cycle: string; hasTracks: boolean }>>([])
  const [tracks, setTracks] = useState<Array<{ id: string; name: string }>>([])
  const [selectedSchoolGrade, setSelectedSchoolGrade] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ClassroomInput>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      schoolYear: new Date().getFullYear().toString(),
    }
  })

  const schoolGradeId = watch("schoolGradeId")

  // Fetch school grades on mount
  useEffect(() => {
    getSchoolGrades().then((result) => {
      if (result.success) {
        setSchoolGrades(result.data)
      }
    })
  }, [])

  // Fetch tracks when school grade changes
  useEffect(() => {
    if (schoolGradeId && schoolGradeId !== selectedSchoolGrade) {
      setSelectedSchoolGrade(schoolGradeId)
      const selectedGrade = schoolGrades.find((sg) => sg.id === schoolGradeId)
      if (selectedGrade?.hasTracks) {
        getTracks(schoolGradeId).then((result) => {
          if (result.success) {
            setTracks(result.data)
          }
        })
      } else {
        setTracks([])
        setValue("trackId", undefined)
      }
    }
  }, [schoolGradeId, selectedSchoolGrade, schoolGrades, setValue])

  const onSubmit = async (data: ClassroomInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createClassroom(data)

      if (result.success) {
        router.push("/admin/academics/classrooms")
      } else {
        setError(result.error || "Failed to create classroom")
      }
    } catch (err) {
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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nouvelle classe</h1>

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
              <label htmlFor="trackId" className="block text-sm font-medium text-gray-700 mb-2">
                Série
              </label>
              <select
                {...register("trackId")}
                id="trackId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Création..." : "Créer la classe"}
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
