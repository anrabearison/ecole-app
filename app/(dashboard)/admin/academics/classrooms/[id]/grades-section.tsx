"use client"

import { useState } from "react"
import { Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateClassReportCardsPdf } from "@/lib/actions/report-card"
import type { ClassGradesResult } from "@/lib/actions/class-grades"
import { GradesPreview } from "@/app/(dashboard)/teacher/report-cards/grades-preview"

interface ClassroomGradesSectionProps {
  classroomId: string
  periods: Array<{ id: string; name: string; schoolYear: string }>
}

export function ClassroomGradesSection({ classroomId, periods }: ClassroomGradesSectionProps) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("")
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "loading" | "error">("idle")
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const handleDownloadClassPdf = async () => {
    if (!selectedPeriodId) return

    setDownloadStatus("loading")
    setDownloadError(null)

    try {
      const result = await generateClassReportCardsPdf(classroomId, selectedPeriodId)

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

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Notes & Bulletins</h2>
        {selectedPeriodId && (
          <Button
            onClick={handleDownloadClassPdf}
            disabled={downloadStatus === "loading"}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            {downloadStatus === "loading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Générer bulletins de classe
          </Button>
        )}
      </div>

      {downloadStatus === "error" && downloadError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          ❌ {downloadError}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="period-select" className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
          Sélectionner une période
        </label>
        <select
          id="period-select"
          value={selectedPeriodId}
          onChange={(e) => setSelectedPeriodId(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        >
          <option value="">Choisir une période...</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.schoolYear}
            </option>
          ))}
        </select>
      </div>

      {selectedPeriodId && (
        <div className="mt-4">
          <GradesPreview classroomId={classroomId} periodId={selectedPeriodId} />
        </div>
      )}
    </div>
  )
}
