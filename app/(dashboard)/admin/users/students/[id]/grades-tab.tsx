"use client"

import { useState, useEffect } from "react"
import { upsertReportCardComment, getReportCardComment } from "@/lib/actions/report-card-comment"
import { generateReportCardPdf } from "@/lib/actions/report-card"
import { Button } from "@/components/ui/button"
import { FileText, Download, CheckCircle2, Loader2, MessageSquare } from "lucide-react"

interface ReportCardSectionProps {
  studentId: string
  periodId: string
  periodName?: string
}

export function ReportCardSection({ studentId, periodId, periodName }: ReportCardSectionProps) {
  const [appreciation, setAppreciation] = useState("")
  const [isLoadingAppreciation, setIsLoadingAppreciation] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load appreciation when period changes
  useEffect(() => {
    if (periodId) {
      setIsLoadingAppreciation(true)
      getReportCardComment(studentId, periodId).then((result) => {
        if (result.success && result.data) {
          setAppreciation(result.data.comment)
        } else {
          setAppreciation("")
        }
        setIsLoadingAppreciation(false)
      })
    }
  }, [periodId, studentId])

  const handleSaveAppreciation = async () => {
    if (!periodId) return

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    const result = await upsertReportCardComment({
      comment: appreciation,
      studentId,
      periodId,
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
    if (!periodId) return

    setIsGeneratingPdf(true)
    setError(null)

    const result = await generateReportCardPdf(studentId, periodId)

    if (result.success) {
      const binaryString = window.atob(result.data.pdfBase64)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: "application/pdf" })
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
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Bulletin Scolaire {periodName ? `— ${periodName}` : ""}</h3>
            <p className="text-xs text-gray-500">Saisissez l&apos;appréciation générale et générez le document PDF officiel.</p>
          </div>
        </div>

        <Button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf || !periodId}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-xs"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Génération du PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Télécharger le bulletin PDF</span>
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      {/* Appreciation input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
          <span>Appréciation générale du conseil / de la direction</span>
        </label>

        {isLoadingAppreciation ? (
          <div className="py-4 text-center text-xs text-gray-400">Chargement de l&apos;appréciation...</div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={appreciation}
              onChange={(e) => setAppreciation(e.target.value)}
              placeholder="Ex : Trimestre très satisfaisant. Élève sérieux et investi dans son travail..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-y"
            />

            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveAppreciation}
                disabled={isSaving || !periodId}
                className="gap-1.5 text-xs font-medium"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sauvegarde...</span>
                  </>
                ) : (
                  <span>Enregistrer l&apos;appréciation</span>
                )}
              </Button>

              {success && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Appréciation enregistrée
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

