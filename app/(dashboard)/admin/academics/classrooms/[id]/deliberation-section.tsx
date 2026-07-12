"use client"

import { useEffect, useState } from "react"
import { runDeliberationForClassroom, listDeliberationsForClassroom } from "@/lib/actions/deliberation"
import { Button } from "@/components/ui/button"
import type { DeliberationDecision } from "@prisma/client"

interface DeliberationRow {
  studentId: string
  studentFirstName: string
  studentLastName: string
  studentAverage: number
  decision: DeliberationDecision
  observations: string | null
}

interface ClassroomDeliberationSectionProps {
  classroomId: string
  schoolYear: string
}

export function ClassroomDeliberationSection({ classroomId, schoolYear }: ClassroomDeliberationSectionProps) {
  const [deliberations, setDeliberations] = useState<DeliberationRow[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const loadDeliberations = async () => {
    setIsLoading(true)
    setError(null)
    const result = await listDeliberationsForClassroom(classroomId, schoolYear)

    if (result.success) {
      setDeliberations(result.data)
    } else {
      setError(result.error)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    loadDeliberations()
  }, [classroomId, schoolYear])

  const handleRunDeliberation = async () => {
    setIsRunning(true)
    setError(null)
    setStatus(null)

    const result = await runDeliberationForClassroom(classroomId, schoolYear)

    if (result.success) {
      setStatus(`Délibération terminée pour ${result.data.processed} élèves`)
      await loadDeliberations()
    } else {
      setError(result.error)
    }

    setIsRunning(false)
  }

  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Délibération annuelle</h2>
          <p className="text-sm text-gray-500">Générez et consultez les résultats de la délibération pour cette classe.</p>
        </div>
        <Button onClick={handleRunDeliberation} disabled={isRunning}>
          {isRunning ? "Exécution..." : "Lancer la délibération"}
        </Button>
      </div>

      {status && (
        <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-4 text-green-800">
          {status}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Résultats</h3>
        {isLoading ? (
          <p className="text-gray-500">Chargement des résultats...</p>
        ) : deliberations.length === 0 ? (
          <p className="text-gray-500">Aucune délibération enregistrée pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700">Élève</th>
                  <th className="px-3 py-2 text-right text-sm font-semibold text-gray-700">Moyenne</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700">Décision</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700">Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {deliberations.map((item) => (
                  <tr key={item.studentId}>
                    <td className="px-3 py-3 text-sm text-gray-900">{item.studentLastName} {item.studentFirstName}</td>
                    <td className="px-3 py-3 text-sm text-right text-gray-900">{item.studentAverage.toFixed(2)}/20</td>
                    <td className="px-3 py-3 text-sm text-gray-900">{item.decision === "PROMOTED" ? "Admis" : "Redouble"}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{item.observations || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
