import { pdf } from "@react-pdf/renderer"
import { ReportCardPDF, type ReportCardData } from "./report-card-pdf"
import { AnnualReportPDF, type AnnualReportData } from "./annual-report-pdf"
import { ClassReportPDF, type ClassReportData } from "./class-report-pdf"

export type { ReportCardData } from "./report-card-pdf"
export type { AnnualReportData } from "./annual-report-pdf"
export type { ClassReportData } from "./class-report-pdf"

export async function generateReportCardPdfBuffer(data: ReportCardData): Promise<Buffer> {
  const pdfDoc = <ReportCardPDF data={data} />
  const pdfBlob = await pdf(pdfDoc).toBlob()
  const arrayBuffer = await pdfBlob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function generateAnnualReportPdfBuffer(data: AnnualReportData): Promise<Buffer> {
  const pdfDoc = <AnnualReportPDF data={data} />
  const pdfBlob = await pdf(pdfDoc).toBlob()
  const arrayBuffer = await pdfBlob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function generateClassReportPdfBuffer(data: ClassReportData): Promise<Buffer> {
  const pdfDoc = <ClassReportPDF data={data} />
  const pdfBlob = await pdf(pdfDoc).toBlob()
  const arrayBuffer = await pdfBlob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
