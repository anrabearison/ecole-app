"use client"

import { useState, useEffect } from "react"
import { upsertReportCardComment, getReportCardComment } from "@/lib/actions/report-card-comment"
import { generateReportCardPdf } from "@/lib/actions/report-card"
import { Button } from "@/components/ui/button"

interface GradesTabProps {
  studentId: string
  studentName: string
  periods: Array<{ id: string; name: string; schoolYear: string }>
}

export function GradesTab({ studentId, studentName, periods }: GradesTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [appreciation, setAppreciation] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load appreciation when period changes
  useEffect(() => {
    if (selectedPeriod) {
      getReportCardComment(studentId, selectedPeriod).then((result) => {
        if (result.success && result.data) {
          setAppreciation(result.data.comment)
        } else {
          setAppreciation("")
        }
      })
    }
  }, [selectedPeriod, studentId])

  const handleSaveAppreciation = async () => {
    if (!selectedPeriod) return

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    const result = await upsertReportCardComment({
      comment: appreciation,
      studentId,
      periodId: selectedPeriod,
    })

    if (result.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error)
    }

    setIsSaving(false)
  }

  const handleDownloadPdf = async () => {
    if (!selectedPeriod) return

    setIsGeneratingPdf(true)
    setError(null)

    const result = await generateReportCardPdf(studentId, selectedPeriod)

    if (result.success) {
      const uint8Array = new Uint8Array(result.data.pdfBuffer)
      const blob = new Blob([uint8Array], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = result.data.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      setError(result.error)
    }

    setIsGeneratingPdf(false)
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Période</h3>
        <select
          className="border rounded px-3 py-2 w-full max-w-xs"
          onChange={(e) => setSelectedPeriod(e.target.value || null)}
        >
          <option value="">Sélectionner une période</option>
          {periods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.name} ({period.schoolYear})
            </option>
          ))}
        </select>
      </div>

      {selectedPeriod && (
        <>
          {/* Appreciation Input */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Appréciation</h3>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[100px]"
              placeholder="Saisir l'appréciation du bulletin..."
              value={appreciation}
              onChange={(e) => setAppreciation(e.target.value)}
            />
            <div className="flex items-center gap-4 mt-4">
              <Button onClick={handleSaveAppreciation} disabled={isSaving}>
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              {success && (
                <span className="text-green-600 text-sm">Enregistré avec succès</span>
              )}
            </div>
          </div>

          {/* Download PDF Button */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
              {isGeneratingPdf ? "Génération..." : "Télécharger le bulletin PDF"}
            </Button>
          </div>
        </>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}
    </div>
  )
}
