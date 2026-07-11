"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createGrades, getClassroomStudents } from "@/lib/actions/grade"
import { listTeacherSubjects } from "@/lib/actions/teacher-subject"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewGradesPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([])
  const [students, setStudents] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])

  const [classroomId, setClassroomId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [type, setType] = useState<"EXAM" | "DAILY">("DAILY")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState<Record<string, number>>({})

  useEffect(() => {
    async function loadData() {
      try {
        const session = await auth()
        if (!session?.user?.teacherId) {
          router.push("/login")
          return
        }

        const subjectsResult = await listTeacherSubjects(session.user.teacherId)
        if (subjectsResult.success) {
          setTeacherSubjects(subjectsResult.data)
        }
      } catch (err) {
        setError("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router])

  useEffect(() => {
    async function loadStudents() {
      if (!classroomId) {
        setStudents([])
        setEntries({})
        return
      }

      const result = await getClassroomStudents(classroomId)
      if (result.success) {
        setStudents(result.data)
        setEntries({})
      }
    }
    loadStudents()
  }, [classroomId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!classroomId || !subjectId) {
      setError("Veuillez sélectionner une classe et une matière")
      setSubmitting(false)
      return
    }

    const entriesArray = Object.entries(entries).map(([studentId, value]) => ({
      studentId,
      value,
    }))

    if (entriesArray.length === 0) {
      setError("Veuillez saisir au moins une note")
      setSubmitting(false)
      return
    }

    const result = await createGrades({
      classroomId,
      subjectId,
      type,
      date,
      entries: entriesArray,
    })

    if (result.success) {
      router.push("/teacher/grades")
      router.refresh()
    } else {
      setError(result.error)
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Saisir des notes</h1>
        <p className="text-gray-600 mt-2">Saisie en masse pour une classe et une matière</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="classroomId">Classe</Label>
              <select
                id="classroomId"
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              >
                <option value="">Sélectionner une classe</option>
                {Array.from(new Set(teacherSubjects.map((ts) => ts.classroom.id))).map((classroomId) => {
                  const classroom = teacherSubjects.find((ts) => ts.classroom.id === classroomId)?.classroom
                  return (
                    <option key={classroomId} value={classroomId}>
                      {classroom?.schoolGrade.name} {classroom?.section} ({classroom?.schoolYear})
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <Label htmlFor="subjectId">Matière</Label>
              <select
                id="subjectId"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={!classroomId}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border disabled:bg-gray-100"
              >
                <option value="">Sélectionner une matière</option>
                {teacherSubjects
                  .filter((ts) => ts.classroom.id === classroomId)
                  .map((ts) => (
                    <option key={ts.subject.id} value={ts.subject.id}>
                      {ts.subject.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as "EXAM" | "DAILY")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              >
                <option value="DAILY">Journalière</option>
                <option value="EXAM">Examen</option>
              </select>
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {students.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Élève
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Note /20
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.lastName} {student.firstName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={entries[student.id] || ""}
                          onChange={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : 0
                            setEntries((prev) => ({
                              ...prev,
                              [student.id]: value,
                            }))
                          }}
                          className="w-24"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={submitting || students.length === 0}>
              {submitting ? "Enregistrement..." : "Enregistrer toutes les notes"}
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
    </div>
  )
}
