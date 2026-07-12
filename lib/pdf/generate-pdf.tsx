import { pdf } from "@react-pdf/renderer"
import { ReportCardDocument, type ReportCardData } from "./report-card"

export async function generateReportCardPdfBuffer(data: ReportCardData): Promise<Buffer> {
  const blob = await pdf(<ReportCardDocument data={data} />).toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
