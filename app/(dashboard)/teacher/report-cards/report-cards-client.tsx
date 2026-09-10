"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useTransition } from "react"
import { BookOpen, Calendar, CheckSquare, Download, Loader2, Save, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveDailyGradeSelection } from "@/lib/actions/daily-grade-selection"
import type { DailyGradeSelectionResult } from "@/lib/actions/daily-grade-selection"
import type { PeriodWithRelations } from "@/lib/actions/period"

type Classroom = { id: string; name: string; schoolYear: string }
type Subject = { id: string; name: string }

interface ReportCardsClientProps {
  classrooms: Classroom[]
  periods: PeriodWithRelations[]
  subjectsForClassroom: Subject[]
  selectionData: DailyGradeSelectionResult | null
  selectedClassroomId?: string
  selectedSubjectId?: string
  selectedPeriodId?: string
}

export function ReportCardsClient({
  classrooms,
  periods,
  subjectsForClassroom,
  selectionData,
  selectedClassroomId,
  selectedSubjectId,
  selectedPeriodId,
}: ReportCardsClientProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [selectedAssessments, setSelectedAssessments] = useState<Set<string>>(
    new Set(selectionData?.assessments.filter((a) => a.selected).map((a) => a.assessmentId) ?? [])
  )

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "loading" | "error">("idle")
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const current = new URLSearchParams()
    if (selectedClassroomId) current.set("classroomId", selectedClassroomId)
    if (selectedSubjectId) current.set("subjectId", selectedSubjectId)
    if (selectedPeriodId) current.set("periodId", selectedPeriodId)

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        current.set(key, value)
      } else {
        current.delete(key)
      }
    }

    // Reset downstream filters
    if ("classroomId" in updates) {
      current.delete("subjectId")
    }

    router.push(`${pathname}?${current.toString()}`)
  }

  const toggleAssessment = (assessmentId: string) => {
    setSelectedAssessments((prev) => {
      const next = new Set(prev)
      if (next.has(assessmentId)) {
        next.delete(assessmentId)
      } else {
        next.add(assessmentId)
      }
      return next
    })
    setSaveStatus("idle")
  }

  const selectAll = () => {
    setSelectedAssessments(new Set(selectionData?.assessments.map((a) => a.assessmentId) ?? []))
    setSaveStatus("idle")
  }

  const selectNone = () => {
    setSelectedAssessments(new Set())
    setSaveStatus("idle")
  }

  const handleSave = async () => {
    if (!selectedClassroomId || !selectedSubjectId || !selectedPeriodId) return

    setSaveStatus("saving")
    setSaveError(null)

    const result = await saveDailyGradeSelection(
      selectedClassroomId,
      selectedSubjectId,
      selectedPeriodId,
      Array.from(selectedAssessments),
    )

    if (result.success) {
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } else {
      setSaveStatus("error")
      setSaveError(result.error)
    }
  }

  const handleDownloadClassPdf = async () => {
    if (!selectedClassroomId || !selectedPeriodId) return

    setDownloadStatus("loading")
    setDownloadError(null)

    try {
      const { generateClassReportCardsPdf } = await import("@/lib/actions/report-card")
      const result = await generateClassReportCardsPdf(selectedClassroomId, selectedPeriodId)

      if (!result.success) {
        setDownloadStatus("error")
        setDownloadError(result.error)
        return
      }

      // Trigger download
      const byteCharacters = atob(result.data.pdfBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = result.data.fileName
      a.click()
      URL.revokeObjectURL(url)
      setDownloadStatus("idle")
    } catch (e: any) {
      setDownloadStatus("error")
      setDownloadError(e?.message || "Erreur inattendue")
    }
  }

  const hasFilters = selectedClassroomId && selectedPeriodId
  const canSave = selectedClassroomId && selectedSubjectId && selectedPeriodId && selectionData

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bulletins de classe</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Sélectionnez les évaluations journalières à inclure dans les bulletins, puis générez le PDF de la classe.
          </p>
        </div>
        {hasFilters && (
          <Button
            id="generate-class-pdf-btn"
            onClick={handleDownloadClassPdf}
            disabled={downloadStatus === "loading"}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm self-start sm:self-auto"
          >
            {downloadStatus === "loading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Générer bulletin de classe
          </Button>
        )}
      </div>

      {downloadStatus === "error" && downloadError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ❌ {downloadError}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Filtres</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Classroom */}
          <div className="space-y-1">
            <label htmlFor="filter-classroom" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Classe
            </label>
            <select
              id="filter-classroom"
              value={selectedClassroomId ?? ""}
              onChange={(e) => updateFilters({ classroomId: e.target.value || undefined })}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              <option value="">Toutes les classes</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.schoolYear})
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <label htmlFor="filter-subject" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Matière
            </label>
            <select
              id="filter-subject"
              value={selectedSubjectId ?? ""}
              onChange={(e) => updateFilters({ subjectId: e.target.value || undefined })}
              disabled={!selectedClassroomId}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Toutes les matières</option>
              {subjectsForClassroom.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div className="space-y-1">
            <label htmlFor="filter-period" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Période
            </label>
            <select
              id="filter-period"
              value={selectedPeriodId ?? ""}
              onChange={(e) => updateFilters({ periodId: e.target.value || undefined })}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              <option value="">Toutes les périodes</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.schoolYear}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Daily Assessment Selection Panel */}
      {selectionData && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50">
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Évaluations journalières — <span className="text-indigo-600">{selectionData.subjectName}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedAssessments.size} / {selectionData.assessments.length} sélectionnée(s)
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
              >
                Tout sélectionner
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={selectNone}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium transition"
              >
                Tout désélectionner
              </button>
            </div>
          </div>

          {/* Assessment list */}
          {selectionData.assessments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Aucune évaluation journalière enregistrée pour cette matière dans cette période.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {selectionData.assessments.map((assessment) => {
                const isSelected = selectedAssessments.has(assessment.assessmentId)
                return (
                  <li
                    key={assessment.assessmentId}
                    className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${
                      isSelected ? "bg-indigo-50/60 hover:bg-indigo-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => toggleAssessment(assessment.assessmentId)}
                  >
                    <div className="shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isSelected ? "text-indigo-900" : "text-gray-700"}`}>
                        {assessment.title || assessment.dateLabel}
                        {assessment.title && (
                          <span className="text-xs text-gray-400 ml-2 font-normal">({assessment.dateLabel})</span>
                        )}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          isSelected
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isSelected ? "Incluse" : "Exclue"}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Save footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/60">
            <div className="text-xs text-gray-500">
              {saveStatus === "saved" && (
                <span className="text-emerald-600 font-medium">✓ Sélection enregistrée</span>
              )}
              {saveStatus === "error" && (
                <span className="text-red-600">❌ {saveError}</span>
              )}
              {saveStatus === "idle" && selectionData.assessments.length > 0 && (
                <span>Cliquez sur les évaluations pour les inclure ou exclure du bulletin.</span>
              )}
            </div>
            <Button
              id="save-selection-btn"
              onClick={handleSave}
              disabled={saveStatus === "saving" || !canSave}
              variant="outline"
              size="sm"
              className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              {saveStatus === "saving" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Enregistrer la sélection
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectionData && !selectedClassroomId && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-indigo-50 mb-4">
            <BookOpen className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            Sélectionnez une classe pour commencer
          </h3>
          <p className="text-sm text-gray-400 max-w-sm">
            Choisissez une classe, une matière et une période pour voir les évaluations journalières disponibles.
          </p>
        </div>
      )}

      {!selectionData && selectedClassroomId && selectedSubjectId && selectedPeriodId && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">
            Aucune évaluation journalière pour cette combinaison classe / matière / période.
          </p>
        </div>
      )}
    </div>
  )
}
