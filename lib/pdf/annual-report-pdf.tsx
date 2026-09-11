import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"

export interface AnnualReportData {
  schoolName: string
  schoolAddress?: string
  schoolLogoUrl?: string
  schoolYear: string
  studentFirstName: string
  studentLastName: string
  className: string
  periodAverages: Array<{ periodName: string; average: number }>
  annualAverage: number
  decision: string
  observations?: string
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1e293b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 16,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
    marginRight: 16,
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  schoolInfo: {
    marginRight: 16,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  schoolAddress: {
    fontSize: 10,
    color: "#64748b",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  annualBadge: {
    backgroundColor: "#f3e8ff",
    color: "#7e22ce",
    borderWidth: 1,
    borderColor: "#d8b4fe",
    padding: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },
  schoolYear: {
    fontSize: 10,
    color: "#475569",
    fontWeight: 500,
  },
  titleBanner: {
    backgroundColor: "#4c1d95",
    color: "#ffffff",
    padding: 12,
    borderRadius: 8,
    textAlign: "center",
    marginBottom: 20,
  },
  titleText: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  studentCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 14,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoGroup: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#64748b",
    fontWeight: "bold",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  table: {
    width: "100%",
    marginBottom: 24,
  },
  tableHeader: {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    fontWeight: "bold",
    fontSize: 10,
    textTransform: "uppercase",
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#cbd5e1",
  },
  tableHeaderCell: {
    padding: 10,
    flex: 1,
  },
  tableHeaderCellRight: {
    padding: 10,
    flex: 0,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableRowEven: {
    backgroundColor: "#f8fafc",
  },
  tableCell: {
    padding: 10,
    flex: 1,
    color: "#334155",
  },
  tableCellRight: {
    padding: 10,
    flex: 0,
    textAlign: "right",
    color: "#334155",
    fontWeight: "bold",
  },
  deliberationBox: {
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deliberationBoxPromoted: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  deliberationBoxRepeated: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  deliberationInfo: {
    flex: 1,
  },
  deliberationLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  deliberationValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
  },
  decisionBadge: {
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: "bold",
  },
  decisionBadgePromoted: {
    backgroundColor: "#16a34a",
    color: "#ffffff",
  },
  decisionBadgeRepeated: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
  },
  observationsBox: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fef3c7",
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
    borderRadius: 6,
    padding: 14,
    marginBottom: 24,
  },
  observationsTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#b45309",
    fontWeight: "bold",
    marginBottom: 6,
  },
  observationsText: {
    fontStyle: "italic",
    color: "#78350f",
    fontSize: 11,
  },
  footer: {
    marginTop: 30,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    textAlign: "center",
    fontSize: 9,
    color: "#94a3b8",
  },
})

export function AnnualReportPDF({ data }: { data: AnnualReportData }) {
  const isPromoted = data.decision.toLowerCase().includes("admis") || data.decision.toLowerCase().includes("promoted")

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {data.schoolLogoUrl ? (
              <Image src={data.schoolLogoUrl} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text>{data.schoolName.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.schoolInfo}>
              <Text style={styles.schoolName}>{data.schoolName}</Text>
              {data.schoolAddress && (
                <Text style={styles.schoolAddress}>{data.schoolAddress}</Text>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.annualBadge}>Bulletin Annuel</Text>
            <Text style={styles.schoolYear}>Année scolaire : {data.schoolYear}</Text>
          </View>
        </View>

        {/* Title Banner */}
        <View style={styles.titleBanner}>
          <Text style={styles.titleText}>Bulletin Annuel de Délibération</Text>
        </View>

        {/* Student Card */}
        <View style={styles.studentCard}>
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Nom & Prénom</Text>
            <Text style={styles.infoValue}>{data.studentLastName} {data.studentFirstName}</Text>
          </View>
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Classe</Text>
            <Text style={styles.infoValue}>{data.className}</Text>
          </View>
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Année Scolaire</Text>
            <Text style={styles.infoValue}>{data.schoolYear}</Text>
          </View>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Moyennes par Période</Text>

        {/* Period Averages Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCell}>Période</Text>
            <Text style={styles.tableHeaderCellRight}>Moyenne Périodique</Text>
          </View>
          {data.periodAverages.map((period, index) => {
            const rowStyle = index % 2 === 0 ? styles.tableRowEven : {}
            return (
              <View key={index} style={[styles.tableRow, rowStyle]}>
                <Text style={styles.tableCell}>{period.periodName}</Text>
                <Text style={styles.tableCellRight}>{period.average.toFixed(2)} / 20</Text>
              </View>
            )
          })}
        </View>

        {/* Deliberation Box */}
        <View style={[styles.deliberationBox, isPromoted ? styles.deliberationBoxPromoted : styles.deliberationBoxRepeated]}>
          <View style={styles.deliberationInfo}>
            <Text style={styles.deliberationLabel}>Moyenne Annuelle de Délibération</Text>
            <Text style={styles.deliberationValue}>{data.annualAverage.toFixed(2)} / 20</Text>
          </View>
          <View style={[styles.decisionBadge, isPromoted ? styles.decisionBadgePromoted : styles.decisionBadgeRepeated]}>
            <Text>{data.decision}</Text>
          </View>
        </View>

        {/* Observations */}
        {data.observations && (
          <View style={styles.observationsBox}>
            <Text style={styles.observationsTitle}>Observations du Conseil de Classe</Text>
            <Text style={styles.observationsText}>"{data.observations}"</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Document annuel généré automatiquement par Sekoly • {new Date().toLocaleDateString("fr-FR")}
        </Text>
      </Page>
    </Document>
  )
}
