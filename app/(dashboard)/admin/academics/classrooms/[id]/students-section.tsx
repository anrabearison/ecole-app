"use client"

import { useEffect, useState } from "react"
import { Loader2, User } from "lucide-react"
import { listStudents } from "@/lib/actions/student"

interface StudentsSectionProps {
  classroomId: string
}

interface StudentData {
  id: string
  firstName: string | null
  lastName: string
  classNumber: number | null
}

export function StudentsSection({ classroomId }: StudentsSectionProps) {
  const [students, setStudents] = useState<StudentData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await listStudents({ classroomId, pageSize: 1000 })
        if (result.success) {
          setStudents(result.data)
        } else {
          setError(result.error || "Erreur lors du chargement des élèves")
        }
      } catch (e: any) {
        setError(e?.message || "Erreur inattendue")
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [classroomId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
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

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <User className="w-8 h-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">Aucun élève inscrit dans cette classe</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 font-medium text-gray-600">N°</th>
            <th className="text-left py-2 px-3 font-medium text-gray-600">Nom</th>
            <th className="text-left py-2 px-3 font-medium text-gray-600">Prénom</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-3 text-gray-600">{student.classNumber || "-"}</td>
              <td className="py-2 px-3 font-medium text-gray-900">{student.lastName}</td>
              <td className="py-2 px-3 text-gray-600">{student.firstName || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
