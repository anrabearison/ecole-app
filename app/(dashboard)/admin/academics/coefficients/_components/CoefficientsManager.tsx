"use client"

import { useState, useTransition } from "react"
import { upsertSubjectCoefficient, deleteSubjectCoefficient, type SubjectCoefficientWithRelations } from "@/lib/actions/subject-coefficient"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Save, RotateCcw, Check, AlertCircle, Layers, BookOpen, Sparkles } from "lucide-react"

type GradeItem = {
  id: string
  name: string
  cycle: string
  order: number
  tracks: Array<{ id: string; name: string }>
}

type SubjectItem = {
  id: string
  name: string
  defaultCoefficient: number
}

type Props = {
  grades: GradeItem[]
  subjects: SubjectItem[]
  initialCoefficients: SubjectCoefficientWithRelations[]
}

export function CoefficientsManager({ grades, subjects, initialCoefficients }: Props) {
  const [selectedGradeId, setSelectedGradeId] = useState<string>(grades[0]?.id ?? "")
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)

  const [coefficients, setCoefficients] = useState<SubjectCoefficientWithRelations[]>(initialCoefficients)
  const [editedValues, setEditedValues] = useState<Record<string, number>>({}) // subjectId -> new coeff number
  const [savingSubjectId, setSavingSubjectId] = useState<string | null>(null)
  const [pendingResetSubjectId, setPendingResetSubjectId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [isPending, startTransition] = useTransition()

  const activeGrade = grades.find((g) => g.id === selectedGradeId)
  const activeTracks = activeGrade?.tracks ?? []

  // Switch grade handler
  const handleSelectGrade = (gradeId: string) => {
    setSelectedGradeId(gradeId)
    setSelectedTrackId(null) // reset selected track when grade changes
    setEditedValues({})
    setMessage(null)
  }

  // Switch track handler
  const handleSelectTrack = (trackId: string | null) => {
    setSelectedTrackId(trackId)
    setEditedValues({})
    setMessage(null)
  }

  // Get current stored entry for a subject under active grade & track
  const getStoredCoefficientEntry = (subjectId: string) => {
    return coefficients.find(
      (c) =>
        c.subjectId === subjectId &&
        c.schoolGradeId === selectedGradeId &&
        (c.trackId ?? null) === (selectedTrackId ?? null)
    )
  }

  // Get the effective value to display in input
  const getDisplayValue = (subject: SubjectItem) => {
    if (editedValues[subject.id] !== undefined) {
      return editedValues[subject.id]
    }
    const entry = getStoredCoefficientEntry(subject.id)
    if (entry) return entry.coefficient

    // If track is selected, check if grade-level default exists
    if (selectedTrackId) {
      const gradeDefault = coefficients.find(
        (c) => c.subjectId === subject.id && c.schoolGradeId === selectedGradeId && c.trackId === null
      )
      if (gradeDefault) return gradeDefault.coefficient
    }

    return subject.defaultCoefficient
  }

  const handleInputChange = (subjectId: string, valueStr: string) => {
    const num = parseFloat(valueStr)
    if (!isNaN(num) && num >= 0 && num <= 20) {
      setEditedValues((prev) => ({ ...prev, [subjectId]: num }))
    }
  }

  const handleSave = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId)
    if (!subject) return

    const newValue = editedValues[subjectId] ?? getDisplayValue(subject)
    setSavingSubjectId(subjectId)
    setMessage(null)

    startTransition(async () => {
      const res = await upsertSubjectCoefficient({
        subjectId,
        schoolGradeId: selectedGradeId,
        trackId: selectedTrackId,
        coefficient: newValue,
      })

      if (res.success) {
        // Update local state
        setCoefficients((prev) => {
          const filtered = prev.filter(
            (c) =>
              !(
                c.subjectId === subjectId &&
                c.schoolGradeId === selectedGradeId &&
                (c.trackId ?? null) === (selectedTrackId ?? null)
              )
          )
          return [
            ...filtered,
            {
              id: res.data.id,
              coefficient: newValue,
              subjectId,
              subject: { id: subject.id, name: subject.name, coefficient: subject.defaultCoefficient },
              schoolGradeId: selectedGradeId,
              schoolGrade: { id: activeGrade!.id, name: activeGrade!.name, cycle: activeGrade!.cycle },
              trackId: selectedTrackId,
              track: selectedTrackId ? activeTracks.find((t) => t.id === selectedTrackId) ?? null : null,
            },
          ]
        })

        // Clear edited state for this subject
        setEditedValues((prev) => {
          const next = { ...prev }
          delete next[subjectId]
          return next
        })

        setMessage({ type: "success", text: `Coefficient de "${subject.name}" enregistré (${newValue}).` })
      } else {
        setMessage({ type: "error", text: res.error })
      }
      setSavingSubjectId(null)
    })
  }

  const handleReset = (subjectId: string) => {
    const entry = getStoredCoefficientEntry(subjectId)
    const subject = subjects.find((s) => s.id === subjectId)
    if (!entry) {
      // Just clear local edits
      setEditedValues((prev) => {
        const next = { ...prev }
        delete next[subjectId]
        return next
      })
      return
    }

    setSavingSubjectId(subjectId)
    setMessage(null)

    startTransition(async () => {
      const res = await deleteSubjectCoefficient(entry.id)

      if (res.success) {
        setCoefficients((prev) => prev.filter((c) => c.id !== entry.id))
        setEditedValues((prev) => {
          const next = { ...prev }
          delete next[subjectId]
          return next
        })
        setMessage({
          type: "success",
          text: `Coefficient spécifique supprimé. Retour au coefficient par défaut (${subject?.defaultCoefficient ?? 1}).`,
        })
      } else {
        setMessage({ type: "error", text: res.error })
      }
      setSavingSubjectId(null)
    })
  }

  if (grades.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-center">
        Aucun niveau scolaire configuré. Veuillez d'abord créer des niveaux (6ème, 5ème, Première, etc.).
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grade Selector Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-3 no-scrollbar">
        {grades.map((grade) => {
          const isActive = grade.id === selectedGradeId
          return (
            <button
              key={grade.id}
              onClick={() => handleSelectGrade(grade.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{grade.name}</span>
              {grade.tracks.length > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {grade.tracks.length} série(s)
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Track Selector Tabs (if active grade has tracks, e.g. Première / Terminale) */}
      {activeTracks.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Série pour le niveau {activeGrade?.name}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSelectTrack(null)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedTrackId === null
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-300"
              }`}
            >
              Par défaut (Toutes les séries)
            </button>

            {activeTracks.map((track) => (
              <button
                key={track.id}
                onClick={() => handleSelectTrack(track.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  selectedTrackId === track.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200"
                }`}
              >
                Série {track.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notification Banner */}
      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-xl text-sm ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Subjects Coefficients Table */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900">
              Coefficients pour {activeGrade?.name}{" "}
              {selectedTrackId
                ? `— Série ${activeTracks.find((t) => t.id === selectedTrackId)?.name}`
                : activeTracks.length > 0
                ? " (Toutes séries)"
                : ""}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Si aucun coefficient spécifique n'est défini, le coefficient par défaut de la matière sera utilisé.
            </p>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucune matière disponible. Créez des matières dans l'onglet "Matières".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                    Matière
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                    Coeff. par défaut
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                    Coeff. pour ce niveau/série
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjects.map((subject) => {
                  const storedEntry = getStoredCoefficientEntry(subject.id)
                  const hasCustomEntry = !!storedEntry
                  const currentVal = getDisplayValue(subject)
                  const hasPendingEdits = editedValues[subject.id] !== undefined
                  const isLoading = savingSubjectId === subject.id

                  return (
                    <tr key={subject.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-4 sm:px-6 font-medium text-gray-900 text-sm">
                        <div className="flex items-center gap-2">
                          <span>{subject.name}</span>
                          {hasCustomEntry && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
                              <Sparkles className="w-3 h-3" /> Personnalisé
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 sm:px-6 text-center text-sm text-gray-500 font-mono">
                        {subject.defaultCoefficient}
                      </td>

                      <td className="px-4 py-4 sm:px-6 text-center">
                        <div className="inline-flex items-center justify-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="20"
                            value={currentVal}
                            onChange={(e) => handleInputChange(subject.id, e.target.value)}
                            className={`w-20 text-center font-bold font-mono text-sm px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                              hasPendingEdits
                                ? "bg-amber-50 border-amber-400 text-amber-900"
                                : hasCustomEntry
                                ? "bg-blue-50 border-blue-300 text-blue-900"
                                : "bg-gray-50 border-gray-300 text-gray-800"
                            }`}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSave(subject.id)}
                            disabled={isLoading || (!hasPendingEdits && hasCustomEntry)}
                            className="gap-1.5 shadow-xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Enregistrer</span>
                          </Button>

                          {hasCustomEntry && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPendingResetSubjectId(subject.id)}
                              disabled={isLoading}
                              className="gap-1.5 text-gray-600 hover:text-gray-900"
                              title="Réinitialiser au coefficient par défaut"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Réinitialiser</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Reset Dialog */}
      {pendingResetSubjectId && (
        <ConfirmDialog
          variant="delete"
          title="Réinitialiser le coefficient"
          message={`Êtes-vous sûr de vouloir supprimer le coefficient personnalisé pour "${subjects.find((s) => s.id === pendingResetSubjectId)?.name}" ? Le coefficient par défaut de la matière sera utilisé à la place.`}
          confirmLabel="Oui, réinitialiser"
          onConfirm={() => {
            const id = pendingResetSubjectId
            setPendingResetSubjectId(null)
            handleReset(id)
          }}
          onCancel={() => setPendingResetSubjectId(null)}
        />
      )}
    </div>
  )
}
