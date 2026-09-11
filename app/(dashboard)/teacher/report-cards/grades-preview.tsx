"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import type { ClassGradesResult } from "@/lib/actions/class-grades"
import { getClassGrades } from "@/lib/actions/class-grades"

interface GradesPreviewProps {
  classroomId: string
  periodId: string
}

export function GradesPreview({ classroomId, periodId }: GradesPreviewProps) {
  const [data, setData] = useState<ClassGradesResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!classroomId || !periodId) return

    setLoading(true)
    setError(null)

    getClassGrades(classroomId, periodId)
      .then((result) => {
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || "Erreur lors du chargement des notes")
        }
      })
      .catch((e) => {
        setError(e?.message || "Erreur inattendue")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [classroomId, periodId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        ❌ {error}
      </div>
    )
  }

  if (!data || data.students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-gray-500">
          Aucune note disponible pour cette classe dans cette période.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info header */}
      <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-gray-500">Classe:</span>
            <span className="ml-2 font-medium text-gray-900">{data.className}</span>
          </div>
          <div>
            <span className="text-gray-500">Période:</span>
            <span className="ml-2 font-medium text-gray-900">{data.periodName}</span>
          </div>
          <div>
            <span className="text-gray-500">Année:</span>
            <span className="ml-2 font-medium text-gray-900">{data.schoolYear}</span>
          </div>
          <div>
            <span className="text-gray-500">Pondération:</span>
            <span className="ml-2 font-medium text-gray-900">
              {(data.examWeight * 100).toFixed(0)}% Examen / {(data.dailyWeight * 100).toFixed(0)}% Journalier
            </span>
          </div>
        </div>
      </div>

      {/* Students grades */}
      {data.students.map((student) => (
        <div key={student.studentId} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60">
            <h3 className="text-sm font-semibold text-gray-800">
              {student.studentLastName} {student.studentFirstName || ""}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Moyenne générale: <span className="font-medium text-gray-900">{student.generalAverage.toFixed(2)}/20</span>
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {student.subjects.map((subject) => (
              <div key={subject.subjectId} className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">{subject.subjectName}</h4>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-gray-500">
                      Journalier: <span className="font-medium text-gray-900">{subject.dailyAverage.toFixed(2)}</span>
                    </span>
                    <span className="text-gray-500">
                      Examen: <span className="font-medium text-gray-900">{subject.examAverage.toFixed(2)}</span>
                    </span>
                    <span className="text-gray-500">
                      Moyenne: <span className="font-medium text-indigo-600">{subject.weightedAverage.toFixed(2)}</span>
                    </span>
                  </div>
                </div>

                {/* Daily grades */}
                {subject.dailyGrades.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Notes journalières</p>
                    <div className="flex flex-wrap gap-2">
                      {subject.dailyGrades.map((grade) => (
                        <span
                          key={grade.assessmentId}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            grade.selected
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-gray-100 text-gray-400 line-through"
                          }`}
                        >
                          {grade.value}/20
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exam grades */}
                {subject.examGrades.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium">Examens</p>
                    <div className="flex flex-wrap gap-2">
                      {subject.examGrades.map((grade) => (
                        <span
                          key={grade.assessmentId}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700"
                        >
                          {grade.value}/20
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {subject.dailyGrades.length === 0 && subject.examGrades.length === 0 && (
                  <p className="text-xs text-gray-400 italic">Aucune note</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
