"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createGrades, getClassroomStudents } from "@/lib/actions/grade"
import { listTeacherSubjects } from "@/lib/actions/teacher-subject"
import { listPeriods } from "@/lib/actions/period"
import { getSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmActionButton } from "@/components/ConfirmDialog"
import { ArrowLeft, ClipboardEdit, Users, AlertTriangle } from "lucide-react"

export default function NewGradesPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([])
  const [students, setStudents] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])
  const [periods, setPeriods] = useState<Array<{ id: string; name: string; schoolYear: string }>>([])

  const [classroomId, setClassroomId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [periodId, setPeriodId] = useState("")
  const [type, setType] = useState<"EXAM" | "DAILY">("DAILY")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState<Record<string, number>>({})

  useEffect(() => {
    async function loadData() {
      try {
        const session = await getSession()
        if (!session?.user?.teacherId) {
          router.push("/login")
          return
        }

        const [subjectsResult, periodsResult] = await Promise.all([
          listTeacherSubjects(session.user.teacherId),
          listPeriods(),
        ])

        if (subjectsResult.success) {
          setTeacherSubjects(subjectsResult.data)
        }

        if (periodsResult.success) {
          setPeriods(periodsResult.data)
          if (periodsResult.data.length > 0) {
            setPeriodId(periodsResult.data[0].id)
          }
        }
      } catch {
        setError("Impossible de charger les données de saisie")
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

    if (!classroomId || !subjectId || !periodId) {
      setError("Veuillez sélectionner une classe, une matière et une période")
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
      periodId,
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
    return <div className="p-8 text-gray-500">Chargement du formulaire de saisie...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/teacher/grades"
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-2 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à mes notes</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Saisir des notes</h1>
        <p className="text-gray-600 mt-1">
          Saisie en masse des évaluations pour une classe et une matière.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Configuration de l'évaluation */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <ClipboardEdit className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Configuration de l'évaluation</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="classroomId" className="font-medium text-gray-700">
                  Classe <span className="text-red-500">*</span>
                </Label>
                <select
                  id="classroomId"
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  className="mt-1.5 block w-full rounded-md border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white"
                >
                  <option value="">Sélectionner une classe</option>
                  {Array.from(new Set(teacherSubjects.map((ts) => ts.classroom.id))).map((cId) => {
                    const classroom = teacherSubjects.find((ts) => ts.classroom.id === cId)?.classroom
                    return (
                      <option key={cId} value={cId}>
                        {classroom?.schoolGrade.name} {classroom?.section} ({classroom?.schoolYear})
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <Label htmlFor="subjectId" className="font-medium text-gray-700">
                  Matière <span className="text-red-500">*</span>
                </Label>
                <select
                  id="subjectId"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  disabled={!classroomId}
                  className="mt-1.5 block w-full rounded-md border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white disabled:bg-gray-100 disabled:text-gray-400"
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <Label htmlFor="periodId" className="font-medium text-gray-700">
                  Période <span className="text-red-500">*</span>
                </Label>
                <select
                  id="periodId"
                  value={periodId}
                  onChange={(e) => setPeriodId(e.target.value)}
                  className="mt-1.5 block w-full rounded-md border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white"
                >
                  <option value="">Sélectionner une période</option>
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name} ({period.schoolYear})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type : Segmented Control Buttons */}
              <div>
                <Label className="font-medium text-gray-700 block mb-1.5">
                  Type d'évaluation <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("DAILY")}
                    className={`py-2 px-3 rounded-lg border font-medium text-sm transition-all ${
                      type === "DAILY"
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs ring-1 ring-blue-600 font-semibold"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Journalière
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("EXAM")}
                    className={`py-2 px-3 rounded-lg border font-medium text-sm transition-all ${
                      type === "EXAM"
                        ? "bg-purple-50 border-purple-600 text-purple-700 shadow-xs ring-1 ring-purple-600 font-semibold"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Examen
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="date" className="font-medium text-gray-700">
                  Date de l'évaluation <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Grille de saisie des élèves */}
        {classroomId && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Notes des élèves</h2>
              </div>
              <span className="text-xs font-medium text-gray-500">
                {students.length} élève(s) dans cette classe
              </span>
            </div>

            {students.length > 0 ? (
              <div className="divide-y divide-gray-200">
                <div className="bg-gray-50/30 px-6 py-3 grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-7">Nom & Prénom de l'élève</div>
                  <div className="col-span-5 text-right">Note sur 20</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <div key={student.id} className="px-6 py-3.5 grid grid-cols-12 items-center hover:bg-gray-50/80 transition-colors">
                      <div className="col-span-7">
                        <span className="text-sm font-semibold text-gray-900 block">
                          {student.lastName} {student.firstName}
                        </span>
                      </div>
                      <div className="col-span-5 flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          placeholder="Note /20"
                          value={entries[student.id] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value
                            setEntries((prev) => {
                              const updated = { ...prev }
                              if (val !== "") {
                                updated[student.id] = parseFloat(val)
                              } else {
                                delete updated[student.id]
                              }
                              return updated
                            })
                          }}
                          className="w-28 font-mono text-center font-bold"
                        />
                        <span className="text-sm font-medium text-gray-400">/ 20</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Aucun élève inscrit dans cette classe.
              </div>
            )}
          </div>
        )}

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
            message="Êtes-vous sûr de vouloir enregistrer toutes les notes saisies ?"
            confirmLabel="Oui, enregistrer"
            disabled={submitting || students.length === 0}
            className="min-w-[180px]"
          >
            {submitting ? "Enregistrement..." : "Enregistrer toutes les notes"}
          </ConfirmActionButton>
        </div>
      </form>
    </div>
  )
}
