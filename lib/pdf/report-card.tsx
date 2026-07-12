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
    marginBottom: 30,
    borderBottom: "2 solid #000",
    paddingBottom: 20,
  },
  schoolName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  schoolAddress: {
    fontSize: 10,
    marginBottom: 10,
  },
  periodInfo: {
    fontSize: 12,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    backgroundColor: "#f0f0f0",
    padding: 5,
  },
  studentInfo: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    fontWeight: "bold",
    width: 100,
  },
  value: {
    flex: 1,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    backgroundColor: "#e0e0e0",
    fontWeight: "bold",
  },
  tableRow: {
    borderBottom: "1 solid #ccc",
  },
  tableCell: {
    padding: 8,
    borderRight: "1 solid #ccc",
  },
  tableCellLast: {
    padding: 8,
  },
  averageSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    border: "1 solid #ccc",
  },
  averageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  averageValue: {
    fontWeight: "bold",
    fontSize: 16,
  },
  appreciationSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fff8e1",
    border: "1 solid #ffc107",
  },
  appreciationLabel: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  appreciationText: {
    fontStyle: "italic",
  },
  footer: {
    marginTop: 30,
    fontSize: 10,
    textAlign: "center",
    color: "#666",
  },
})

export interface ReportCardData {
  schoolName: string
  schoolAddress?: string
  schoolYear: string
  periodName: string
  studentFirstName: string
  studentLastName: string
  className: string
  subjects: Array<{
    name: string
    coefficient: number
    average: number
  }>
  generalAverage: number
  classRank: number
  totalStudents: number
  appreciation?: string
}

export function ReportCardDocument({ data }: { data: ReportCardData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>{data.schoolName}</Text>
          {data.schoolAddress && (
            <Text style={styles.schoolAddress}>{data.schoolAddress}</Text>
          )}
          <Text style={styles.periodInfo}>
            Année scolaire: {data.schoolYear} - {data.periodName}
          </Text>
        </View>

        {/* Student Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations élève</Text>
          <View style={styles.studentInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Nom:</Text>
              <Text style={styles.value}>{data.studentLastName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Prénom:</Text>
              <Text style={styles.value}>{data.studentFirstName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Classe:</Text>
              <Text style={styles.value}>{data.className}</Text>
            </View>
          </View>
        </View>

        {/* Subject Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résultats par matière</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.tableCell, { width: "50%" }]}>
                <Text>Matière</Text>
              </View>
              <View style={[styles.tableCell, { width: "15%" }]}>
                <Text>Coef.</Text>
              </View>
              <View style={styles.tableCellLast}>
                <Text>Moyenne</Text>
              </View>
            </View>
            {data.subjects.map((subject, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: "50%" }]}>
                  <Text>{subject.name}</Text>
                </View>
                <View style={[styles.tableCell, { width: "15%" }]}>
                  <Text>{subject.coefficient}</Text>
                </View>
                <View style={styles.tableCellLast}>
                  <Text>{subject.average.toFixed(2)}/20</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Averages and Rank */}
        <View style={styles.averageSection}>
          <View style={styles.averageRow}>
            <Text>Moyenne générale:</Text>
            <Text style={styles.averageValue}>{data.generalAverage.toFixed(2)}/20</Text>
          </View>
          <View style={styles.averageRow}>
            <Text>Classement:</Text>
            <Text style={styles.averageValue}>
              {data.classRank} / {data.totalStudents}
            </Text>
          </View>
        </View>

        {/* Appreciation */}
        {data.appreciation && (
          <View style={styles.appreciationSection}>
            <Text style={styles.appreciationLabel}>Appréciation:</Text>
            <Text style={styles.appreciationText}>{data.appreciation}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Bulletin généré automatiquement par Sekoly</Text>
        </View>
      </Page>
    </Document>
  )
}
