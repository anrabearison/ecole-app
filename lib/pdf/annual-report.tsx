import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 12,
  },
  header: {
    marginBottom: 24,
    borderBottom: "2 solid #000",
    paddingBottom: 12,
  },
  schoolName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  schoolAddress: {
    fontSize: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
    padding: 6,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    width: 120,
    fontWeight: "bold",
  },
  value: {
    flex: 1,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    padding: 6,
    borderBottom: "1 solid #ccc",
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottom: "1 solid #eee",
  },
  tableCell: {
    flex: 1,
  },
  tableCellSmall: {
    width: 80,
    textAlign: "right",
  },
  averageSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
    border: "1 solid #ccc",
  },
  averageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  averageLabel: {
    fontWeight: "bold",
  },
  decision: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
  },
  observationsSection: {
    marginTop: 18,
    padding: 12,
    backgroundColor: "#fff8e1",
    border: "1 solid #ffc107",
  },
  observationsLabel: {
    fontWeight: "bold",
    marginBottom: 6,
  },
  observationsText: {
    fontStyle: "italic",
  },
  footer: {
    marginTop: 28,
    fontSize: 10,
    textAlign: "center",
    color: "#666",
  },
})

export interface AnnualReportData {
  schoolName: string
  schoolAddress?: string
  schoolYear: string
  studentFirstName: string
  studentLastName: string
  className: string
  periodAverages: Array<{ periodName: string; average: number }>
  annualAverage: number
  decision: string
  observations?: string
}

export function AnnualReportDocument({ data }: { data: AnnualReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.schoolName}>{data.schoolName}</Text>
          {data.schoolAddress && <Text style={styles.schoolAddress}>{data.schoolAddress}</Text>}
          <Text style={styles.title}>Bulletin annuel de délibération</Text>
          <Text>Année scolaire : {data.schoolYear}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations élève</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Nom :</Text>
            <Text style={styles.value}>{data.studentLastName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Prénom :</Text>
            <Text style={styles.value}>{data.studentFirstName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Classe :</Text>
            <Text style={styles.value}>{data.className}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moyennes annuelles par période</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCell}>Période</Text>
              <Text style={styles.tableCellSmall}>Moyenne</Text>
            </View>
            {data.periodAverages.map((period, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{period.periodName}</Text>
                <Text style={styles.tableCellSmall}>{period.average.toFixed(2)}/20</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.averageSection}>
          <View style={styles.averageRow}>
            <Text style={styles.averageLabel}>Moyenne annuelle de délibération :</Text>
            <Text>{data.annualAverage.toFixed(2)}/20</Text>
          </View>
          <Text style={styles.decision}>{data.decision}</Text>
        </View>

        {data.observations && (
          <View style={styles.observationsSection}>
            <Text style={styles.observationsLabel}>Observations :</Text>
            <Text style={styles.observationsText}>{data.observations}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Document généré automatiquement par Sekoly</Text>
        </View>
      </Page>
    </Document>
  )
}
