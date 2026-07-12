"use client"

import { useState } from "react"
import { generateAnnualReportPdf } from "@/lib/actions/deliberation"
import { Button } from "@/components/ui/button"

interface DownloadAnnualReportButtonProps {
  studentId: string
  schoolYear: string
  studentName: string
}

export function DownloadAnnualReportButton({ studentId, schoolYear, studentName }: DownloadAnnualReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setIsGenerating(true)
    setError(null)

    const result = await generateAnnualReportPdf(studentId, schoolYear)

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
      <Button onClick={handleDownload} disabled={isGenerating} variant="secondary">
        {isGenerating ? "Génération..." : "Télécharger le bulletin annuel"}
      </Button>
      {error && (
        <div className="mt-2 text-red-600 text-sm">{error}</div>
      )}
    </div>
  )
}
