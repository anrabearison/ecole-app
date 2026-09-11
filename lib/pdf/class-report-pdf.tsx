import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import { ReportCardPDF, type ReportCardData } from "./report-card-pdf"

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1e293b",
  },
  cover: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 16,
    textAlign: "center",
  },
  coverSubtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 32,
    textAlign: "center",
  },
  coverInfo: {
    fontSize: 14,
    color: "#334155",
    marginBottom: 8,
  },
  coverDivider: {
    width: "60%",
    height: 2,
    backgroundColor: "#e2e8f0",
    marginVertical: 32,
  },
  coverFooter: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 32,
  },
})

export interface ClassReportData {
  className: string
  periodName: string
  schoolYear: string
  reportCards: ReportCardData[]
}

export function ClassReportPDF({ data }: { data: ClassReportData }) {
  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.cover}>
        <Text style={styles.coverTitle}>Bulletins de Notes</Text>
        <Text style={styles.coverSubtitle}>{data.className}</Text>
        <View style={styles.coverDivider} />
        <Text style={styles.coverInfo}>Période : {data.periodName}</Text>
        <Text style={styles.coverInfo}>Année scolaire : {data.schoolYear}</Text>
        <Text style={styles.coverInfo}>Nombre d'élèves : {data.reportCards.length}</Text>
        <View style={styles.coverDivider} />
        <Text style={styles.coverFooter}>
          Document généré automatiquement par Sekoly • {new Date().toLocaleDateString("fr-FR")}
        </Text>
      </Page>

      {/* Individual Report Cards */}
      {data.reportCards.map((reportCard, index) => (
        <ReportCardPDF key={index} data={reportCard} />
      ))}
    </Document>
  )
}
