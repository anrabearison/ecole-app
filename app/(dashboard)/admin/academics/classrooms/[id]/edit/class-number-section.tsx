"use client"

import { useState, useEffect, useTransition } from "react"
import { Hash, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateClassNumbers } from "@/lib/actions/student"
import { listStudents } from "@/lib/actions/student"

type StudentRow = {
  id: string
  lastName: string
  firstName: string | null
  classNumber: number | null
}

interface ClassNumberSectionProps {
  classroomId: string
}

export function ClassNumberSection({ classroomId }: ClassNumberSectionProps) {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fetchStudents = async () => {
    setLoading(true)
    const result = await listStudents({ classroomId, pageSize: 200 })
    if (result.success) {
      setStudents(
        result.data.map((s) => ({
          id: s.id,
          lastName: s.lastName,
          firstName: s.firstName ?? null,
          classNumber: s.classNumber ?? null,
        }))
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStudents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId])

  const allAssigned = students.length > 0 && students.every((s) => s.classNumber !== null)
  const unassignedCount = students.filter((s) => s.classNumber === null).length

  const handleGenerate = () => {
    startTransition(async () => {
      setStatus("idle")
      setMessage(null)
      const result = await generateClassNumbers(classroomId)
      if (result.success) {
        if (result.data.updatedCount === 0) {
          setStatus("success")
          setMessage("Tous les élèves ont déjà un numéro de classe.")
        } else {
          setStatus("success")
          setMessage(`${result.data.updatedCount} numéro(s) attribué(s) avec succès.`)
        }
        await fetchStudents()
      } else {
        setStatus("error")
        setMessage(result.error ?? "Erreur inconnue")
      }
    })
  }

  // Sort students: assigned first (by classNumber), then unassigned (alphabetically)
  const sorted = [...students].sort((a, b) => {
    if (a.classNumber !== null && b.classNumber !== null) return a.classNumber - b.classNumber
    if (a.classNumber !== null) return -1
    if (b.classNumber !== null) return 1
    return a.lastName.localeCompare(b.lastName, "fr", { sensitivity: "base" })
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50">
            <Hash className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Numéros de classe</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {loading
                ? "Chargement..."
                : students.length === 0
                  ? "Aucun élève inscrit dans cette classe"
                  : allAssigned
                    ? `${students.length} élève(s) — tous numérotés`
                    : `${students.length} élève(s) — ${unassignedCount} sans numéro`}
            </p>
          </div>
        </div>

        <Button
          id="generate-class-numbers-btn"
          type="button"
          onClick={handleGenerate}
          disabled={isPending || loading || students.length === 0 || allAssigned}
          size="sm"
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Générer les numéros
        </Button>
      </div>

      {/* Status feedback */}
      {status !== "idle" && message && (
        <div
          className={`flex items-center gap-2 px-5 py-3 text-sm border-b ${
            status === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-red-50 text-red-700 border-red-100"
          }`}
        >
          {status === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {message}
        </div>
      )}

      {/* Info note */}
      {!allAssigned && students.length > 0 && (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
          ⚠ Les numéros attribués sont <strong>définitifs</strong>. Les élèves sans numéro seront classés par ordre alphabétique (Nom, Prénom). Les nouvelles inscriptions recevront le dernier numéro disponible.
        </div>
      )}

      {/* Student list */}
      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Chargement des élèves...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-gray-400">
          Aucun élève inscrit dans cette classe pour le moment.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {sorted.map((student) => (
            <li
              key={student.id}
              className={`flex items-center gap-4 px-5 py-3 ${
                student.classNumber === null ? "bg-amber-50/40" : ""
              }`}
            >
              {/* Class number badge */}
              <div className="shrink-0 w-10 text-center">
                {student.classNumber !== null ? (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold">
                    {student.classNumber}
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400 text-xs">
                    —
                  </span>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {student.lastName.toUpperCase()}
                  {student.firstName ? ` ${student.firstName}` : ""}
                </p>
              </div>

              {/* Status tag */}
              <span
                className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                  student.classNumber !== null
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {student.classNumber !== null ? "Attribué" : "Non attribué"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
