"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ChangeEvent } from "react"

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

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateFilters(event.target.name, event.target.value)
  }

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateFilters(event.target.name, event.target.value)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-wrap gap-4">
        <select
          name="classroomId"
          value={values.classroomId || ""}
          onChange={handleSelectChange}
          className="border rounded px-3 py-2"
        >
          <option value="">Toutes les classes</option>
          {classrooms.map((classroom) => (
            <option key={classroom.id} value={classroom.id}>
              {classroom.name} ({classroom.schoolYear})
            </option>
          ))}
        </select>

        <select
          name="subjectId"
          value={values.subjectId || ""}
          onChange={handleSelectChange}
          className="border rounded px-3 py-2"
        >
          <option value="">Toutes les matières</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>

        {mode === "admin" && (
          <select
            name="teacherId"
            value={values.teacherId || ""}
            onChange={handleSelectChange}
            className="border rounded px-3 py-2"
          >
            <option value="">Tous les enseignants</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.firstName} {teacher.lastName}
              </option>
            ))}
          </select>
        )}

        <select
          name="periodId"
          value={values.periodId || ""}
          onChange={handleSelectChange}
          className="border rounded px-3 py-2"
        >
          <option value="">Toutes les périodes</option>
          {periods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.name} ({period.schoolYear})
            </option>
          ))}
        </select>

        <select
          name="type"
          value={values.type || ""}
          onChange={handleSelectChange}
          className="border rounded px-3 py-2"
        >
          <option value="">Tous les types</option>
          <option value="EXAM">Examen</option>
          <option value="DAILY">Journalière</option>
        </select>

        <input
          type="date"
          name="startDate"
          value={values.startDate || ""}
          onChange={handleDateChange}
          className="border rounded px-3 py-2"
          placeholder="Date début"
        />

        <input
          type="date"
          name="endDate"
          value={values.endDate || ""}
          onChange={handleDateChange}
          className="border rounded px-3 py-2"
          placeholder="Date fin"
        />
      </div>
    </div>
  )
}
