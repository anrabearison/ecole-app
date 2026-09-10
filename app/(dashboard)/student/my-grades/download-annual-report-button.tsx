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
