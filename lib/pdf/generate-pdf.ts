import { generatePdfFromHtml } from "./browser"
import { renderReportCardHtml, type ReportCardData } from "./report-card-template"
import { renderAnnualReportHtml, type AnnualReportData } from "./annual-report-template"

export type { ReportCardData } from "./report-card-template"
export type { AnnualReportData } from "./annual-report-template"

export async function generateReportCardPdfBuffer(data: ReportCardData): Promise<Buffer> {
  const html = renderReportCardHtml(data)
  return generatePdfFromHtml(html)
}

export async function generateAnnualReportPdfBuffer(data: AnnualReportData): Promise<Buffer> {
  const html = renderAnnualReportHtml(data)
  return generatePdfFromHtml(html)
}
