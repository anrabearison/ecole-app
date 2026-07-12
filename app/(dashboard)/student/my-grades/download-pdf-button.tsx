"use client"

import { useState } from "react"
import { generateReportCardPdf } from "@/lib/actions/report-card"
import { Button } from "@/components/ui/button"

interface DownloadPdfButtonProps {
  studentId: string
  periodId: string
  studentName: string
  periodName: string
}

export function DownloadPdfButton({ studentId, periodId, studentName, periodName }: DownloadPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setIsGenerating(true)
    setError(null)

    const result = await generateReportCardPdf(studentId, periodId)

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

    setIsGenerating(false)
  }

  return (
    <div>
      <Button onClick={handleDownload} disabled={isGenerating}>
        {isGenerating ? "Génération..." : "Télécharger le bulletin PDF"}
      </Button>
      {error && (
        <div className="mt-2 text-red-600 text-sm">{error}</div>
      )}
    </div>
  )
}
