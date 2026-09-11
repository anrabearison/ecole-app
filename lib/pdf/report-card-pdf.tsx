import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"

export interface ReportCardData {
  schoolName: string
  schoolAddress?: string
  schoolLogoUrl?: string
  schoolYear: string
  periodName: string
  studentFirstName: string
  studentLastName: string
  dateOfBirth?: string
  className: string
  classNumber?: number
  sex?: string
  subjects: Array<{
    name: string
    coefficient: number
    dailyAverage: number
    examAverage: number
    weightedAverage: number
    finalNote: number
    rank: number
    totalStudents: number
  }>
  totalNotes: number
  totalCoefficients: number
  generalAverage: number
  classRank: number
  totalStudents: number
  appreciation?: string
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
  periodBadge: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    borderWidth: 1,
    borderColor: "#bfdbfe",
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
    backgroundColor: "#1e3a8a",
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
  summaryGrid: {
    flexDirection: "row",
    marginBottom: 24,
  },
  summaryBox: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    textAlign: "center",
    marginRight: 16,
  },
  summaryBoxLast: {
    marginRight: 0,
  },
  summaryBoxAverage: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  summaryBoxRank: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  summaryValueAverage: {
    color: "#1d4ed8",
  },
  summaryValueRank: {
    color: "#15803d",
  },
  appreciationBox: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fef3c7",
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
    borderRadius: 6,
    padding: 14,
    marginBottom: 24,
  },
  appreciationTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#b45309",
    fontWeight: "bold",
    marginBottom: 6,
  },
  appreciationText: {
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

function mapAppreciationToFrench(appreciation: string): string {
  const mapping: Record<string, string> = {
    EXCELLENT: "Félicitation",
    HONOR_ROLL: "Tableau d'honneur",
    ENCOURAGEMENT: "Encouragement",
    INSUFFICIENT: "Insuffisant",
    WARNING: "Avertissement",
    BLAME: "Blâme",
  }
  return mapping[appreciation] || appreciation
}

export function ReportCardPDF({ data }: { data: ReportCardData }) {
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
            <Text style={styles.periodBadge}>{data.periodName}</Text>
            <Text style={styles.schoolYear}>Année scolaire : {data.schoolYear}</Text>
          </View>
        </View>

        {/* Title Banner */}
        <View style={styles.titleBanner}>
          <Text style={styles.titleText}>Bulletin de Notes Trimestriel</Text>
        </View>

        {/* Student Card */}
        <View style={styles.studentCard}>
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Nom & Prénoms</Text>
            <Text style={styles.infoValue}>{data.studentLastName} {data.studentFirstName}</Text>
          </View>
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Date de Naissance</Text>
            <Text style={styles.infoValue}>{data.dateOfBirth || "………………"}</Text>
          </View>
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Classe</Text>
            <Text style={styles.infoValue}>{data.className}</Text>
          </View>
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>N°</Text>
            <Text style={styles.infoValue}>{data.classNumber || "……"}</Text>
          </View>
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Sexe</Text>
            <Text style={styles.infoValue}>{data.sex || "……"}</Text>
          </View>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Résultats par Matière</Text>

        {/* Subjects Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>MATIÈRE</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0, textAlign: "center" }]}>MJ</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0, textAlign: "center" }]}>COMP</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0, textAlign: "center" }]}>MJ+C/2</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0, textAlign: "center" }]}>COEFF</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0, textAlign: "center" }]}>NOTES DÉFIN</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0, textAlign: "center" }]}>RANG</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0, textAlign: "center" }]}>APPREC/EMARG</Text>
          </View>
          {data.subjects.map((subject, index) => {
            const rowStyle = index % 2 === 0 ? styles.tableRowEven : {}
            return (
              <View key={index} style={[styles.tableRow, rowStyle]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{subject.name}</Text>
                <Text style={[styles.tableCell, { flex: 0, textAlign: "center" }]}>{subject.dailyAverage.toFixed(2)}</Text>
                <Text style={[styles.tableCell, { flex: 0, textAlign: "center" }]}>{subject.examAverage.toFixed(2)}</Text>
                <Text style={[styles.tableCell, { flex: 0, textAlign: "center" }]}>{subject.weightedAverage.toFixed(2)}</Text>
                <Text style={[styles.tableCell, { flex: 0, textAlign: "center" }]}>{subject.coefficient}</Text>
                <Text style={[styles.tableCell, { flex: 0, textAlign: "center" }]}>{subject.finalNote.toFixed(2)}</Text>
                <Text style={[styles.tableCell, { flex: 0, textAlign: "center" }]}>{subject.rank}</Text>
                <Text style={[styles.tableCell, { flex: 0, textAlign: "center" }]}></Text>
              </View>
            )
          })}
          {/* Total Row */}
          <View style={[styles.tableRow, { backgroundColor: "#f1f5f9" }]}>
            <Text style={[styles.tableCell, { flex: 2, fontWeight: "bold" }]}></Text>
            <Text style={[styles.tableCell, { flex: 0, textAlign: "center" }]}></Text>
            <Text style={[styles.tableCell, { flex: 0, textAlign: "center" }]}></Text>
            <Text style={[styles.tableCell, { flex: 0, textAlign: "center" }]}></Text>
            <Text style={[styles.tableCell, { flex: 0, textAlign: "center", fontWeight: "bold" }]}>{data.totalCoefficients}</Text>
            <Text style={[styles.tableCell, { flex: 0, textAlign: "center", fontWeight: "bold" }]}>TOTAL : {data.totalNotes.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { flex: 0, textAlign: "center" }]}></Text>
            <Text style={[styles.tableCell, { flex: 0, textAlign: "center" }]}></Text>
          </View>
        </View>

        {/* Summary Grid */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryBox, styles.summaryBoxAverage]}>
            <Text style={styles.summaryLabel}>Moyenne Générale</Text>
            <Text style={[styles.summaryValue, styles.summaryValueAverage]}>{data.generalAverage.toFixed(2)} / 20</Text>
          </View>
          <View style={[styles.summaryBox, styles.summaryBoxRank]}>
            <Text style={styles.summaryLabel}>Rang</Text>
            <Text style={[styles.summaryValue, styles.summaryValueRank]}>{data.classRank} / {data.totalStudents} ÉLÈVES</Text>
          </View>
          <View style={[styles.summaryBox, styles.summaryBoxAverage, styles.summaryBoxLast]}>
            <Text style={styles.summaryLabel}>Nombre de jours d'absence</Text>
            <Text style={[styles.summaryValue, styles.summaryValueAverage]}>………….jours</Text>
          </View>
        </View>

        {/* Council Decision */}
        {data.appreciation && (
          <View style={styles.appreciationBox}>
            <Text style={styles.appreciationTitle}>DÉCISION DU CONSEIL</Text>
            <Text style={styles.appreciationText}>{mapAppreciationToFrench(data.appreciation)}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Bulletin généré automatiquement par Sekoly • {new Date().toLocaleDateString("fr-FR")}
        </Text>
      </Page>
    </Document>
  )
}
