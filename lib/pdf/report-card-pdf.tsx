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
  classNumber?: string
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
    padding: 20,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  schoolInfo: {
    marginRight: 12,
  },
  schoolName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  schoolAddress: {
    fontSize: 9,
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
    padding: 3,
    paddingHorizontal: 10,
    borderRadius: 15,
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
  },
  schoolYear: {
    fontSize: 9,
    color: "#475569",
    fontWeight: 500,
  },
  titleBanner: {
    backgroundColor: "#1e3a8a",
    color: "#ffffff",
    padding: 10,
    borderRadius: 6,
    textAlign: "center",
    marginBottom: 16,
  },
  titleText: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  studentCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  infoGroup: {
    marginBottom: 6,
    marginRight: 16,
  },
  infoLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#64748b",
    fontWeight: "bold",
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  table: {
    width: "100%",
    marginBottom: 20,
  },
  tableHeader: {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    fontWeight: "bold",
    fontSize: 8,
    textTransform: "uppercase",
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#cbd5e1",
  },
  tableHeaderCell: {
    padding: 6,
    textAlign: "center",
    fontSize: 8,
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
    padding: 6,
    textAlign: "center",
    fontSize: 9,
    color: "#334155",
  },
  tableCellBold: {
    padding: 6,
    textAlign: "center",
    fontSize: 9,
    color: "#334155",
    fontWeight: "bold",
  },
  tableCellLeft: {
    padding: 6,
    textAlign: "left",
    fontSize: 9,
    color: "#334155",
  },
  summaryGrid: {
    flexDirection: "row",
    marginBottom: 20,
  },
  summaryBox: {
    flex: 1,
    borderRadius: 6,
    padding: 12,
    textAlign: "center",
    marginRight: 12,
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
    fontSize: 8,
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 16,
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
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  appreciationTitle: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#b45309",
    fontWeight: "bold",
    marginBottom: 4,
  },
  appreciationText: {
    fontStyle: "italic",
    color: "#78350f",
    fontSize: 10,
  },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    textAlign: "center",
    fontSize: 8,
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
            <Text style={[styles.tableHeaderCell, { width: "25%" }]}>MATIÈRE</Text>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>MJ</Text>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>COMP</Text>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>MJ+C/2</Text>
            <Text style={[styles.tableHeaderCell, { width: "8%" }]}>COEFF</Text>
            <Text style={[styles.tableHeaderCell, { width: "12%" }]}>NOTE</Text>
            <Text style={[styles.tableHeaderCell, { width: "8%" }]}>RANG</Text>
            <Text style={[styles.tableHeaderCell, { width: "17%" }]}>APPREC</Text>
          </View>
          {data.subjects.map((subject, index) => {
            const rowStyle = index % 2 === 0 ? styles.tableRowEven : {}
            return (
              <View key={index} style={[styles.tableRow, rowStyle]}>
                <Text style={[styles.tableCellLeft, { width: "25%" }]}>{subject.name}</Text>
                <Text style={[styles.tableCell, { width: "10%" }]}>{subject.dailyAverage.toFixed(2)}</Text>
                <Text style={[styles.tableCell, { width: "10%" }]}>{subject.examAverage.toFixed(2)}</Text>
                <Text style={[styles.tableCell, { width: "10%" }]}>{subject.weightedAverage.toFixed(2)}</Text>
                <Text style={[styles.tableCell, { width: "8%" }]}>{subject.coefficient}</Text>
                <Text style={[styles.tableCell, { width: "12%" }]}>{subject.finalNote.toFixed(2)}</Text>
                <Text style={[styles.tableCell, { width: "8%" }]}>{subject.rank}</Text>
                <Text style={[styles.tableCell, { width: "17%" }]}></Text>
              </View>
            )
          })}
          {/* Total Row */}
          <View style={[styles.tableRow, { backgroundColor: "#f1f5f9" }]}>
            <Text style={[styles.tableCellBold, { width: "25%" }]}></Text>
            <Text style={[styles.tableCell, { width: "10%" }]}></Text>
            <Text style={[styles.tableCell, { width: "10%" }]}></Text>
            <Text style={[styles.tableCell, { width: "10%" }]}></Text>
            <Text style={[styles.tableCellBold, { width: "8%" }]}>{data.totalCoefficients}</Text>
            <Text style={[styles.tableCellBold, { width: "12%" }]}>TOTAL: {data.totalNotes.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { width: "8%" }]}></Text>
            <Text style={[styles.tableCell, { width: "17%" }]}></Text>
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
