import { pdf } from "@react-pdf/renderer"
import { ReportCardDocument, type ReportCardData } from "./report-card"
import { AnnualReportDocument, type AnnualReportData } from "./annual-report"

export async function generateReportCardPdfBuffer(data: ReportCardData): Promise<Buffer> {
  const blob = await pdf(<ReportCardDocument data={data} />).toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function generateAnnualReportPdfBuffer(data: AnnualReportData): Promise<Buffer> {
  const blob = await pdf(<AnnualReportDocument data={data} />).toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
