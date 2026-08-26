"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Filter, RotateCcw } from "lucide-react"

type GradeFilterValues = {
  classroomId?: string
  subjectId?: string
  teacherId?: string
  periodId?: string
  type?: "EXAM" | "DAILY"
  startDate?: string
  endDate?: string
}

type GradeFilterProps = {
  values: GradeFilterValues
  classrooms: Array<{ id: string; name: string; schoolYear: string }>
  subjects: Array<{ id: string; name: string }>
  teachers: Array<{ id: string; firstName: string; lastName: string }>
  periods: Array<{ id: string; name: string; schoolYear: string }>
  mode: "admin" | "teacher"
}

export function GradeFilters({ values, classrooms, subjects, teachers, periods, mode }: GradeFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateFilters = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(name, value)
    } else {
      params.delete(name)
    }

    // Reset page to 1 when filters change
    params.delete('page')

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const resetFilters = () => {
    router.push(pathname)
  }

  const hasActiveFilters = Boolean(
    values.classroomId || values.subjectId || values.teacherId || values.periodId || values.type || values.startDate || values.endDate
  )

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 mb-6 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Filtres de recherche</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser les filtres
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Classroom Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Classe</label>
          <select
            name="classroomId"
            value={values.classroomId || ""}
            onChange={(e) => updateFilters("classroomId", e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border bg-white"
          >
            <option value="">Toutes les classes</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name} ({classroom.schoolYear})
              </option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Matière</label>
          <select
            name="subjectId"
            value={values.subjectId || ""}
            onChange={(e) => updateFilters("subjectId", e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border bg-white"
          >
            <option value="">Toutes les matières</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {/* Teacher Filter (Admin mode) */}
        {mode === "admin" && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Enseignant</label>
            <select
              name="teacherId"
              value={values.teacherId || ""}
              onChange={(e) => updateFilters("teacherId", e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border bg-white"
            >
              <option value="">Tous les enseignants</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.firstName} {teacher.lastName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Period Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Période</label>
          <select
            name="periodId"
            value={values.periodId || ""}
            onChange={(e) => updateFilters("periodId", e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border bg-white"
          >
            <option value="">Toutes les périodes</option>
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name} ({period.schoolYear})
              </option>
            ))}
          </select>
        </div>

        {/* Type Segmented Control */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type d'évaluation</label>
          <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => updateFilters("type", "")}
              className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                !values.type ? "bg-white text-gray-900 shadow-xs font-semibold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => updateFilters("type", "EXAM")}
              className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                values.type === "EXAM" ? "bg-purple-600 text-white shadow-xs font-semibold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Examen
            </button>
            <button
              type="button"
              onClick={() => updateFilters("type", "DAILY")}
              className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                values.type === "DAILY" ? "bg-blue-600 text-white shadow-xs font-semibold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Journalière
            </button>
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Du</label>
          <input
            type="date"
            name="startDate"
            value={values.startDate || ""}
            onChange={(e) => updateFilters("startDate", e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border bg-white"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Au</label>
          <input
            type="date"
            name="endDate"
            value={values.endDate || ""}
            onChange={(e) => updateFilters("endDate", e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border bg-white"
          />
        </div>
      </div>
    </div>
  )
}
