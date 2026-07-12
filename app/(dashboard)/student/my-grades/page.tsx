import { listGradesForStudent } from "@/lib/actions/grade"
import { listPeriods } from "@/lib/actions/period"
import { getStudentSubjectAverages, calculateGeneralAverage } from "@/lib/actions/average"
import { getStudentById } from "@/lib/actions/student"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DownloadPdfButton } from "./download-pdf-button"

export default async function StudentGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodId?: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const { periodId } = await searchParams
  const [gradesResult, periodsResult] = await Promise.all([
    listGradesForStudent(),
    listPeriods(),
  ])

  if (!gradesResult.success) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erreur : {gradesResult.error}</p>
      </div>
    )
  }

  const grades = gradesResult.data
  const periods = periodsResult.success ? periodsResult.data : []
  const selectedPeriodId = periodId || periods[0]?.id || ""
  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId) || null

  let studentName = ""
  let subjectAverages: Array<{ subjectId: string; subjectName: string; coefficient: number; average: number }> = []
  let generalAverage = 0

  if (session.user.studentId) {
    const studentResult = await getStudentById(session.user.studentId)
    if (studentResult.success && studentResult.data) {
      studentName = `${studentResult.data.firstName} ${studentResult.data.lastName}`
    }
  }

  if (selectedPeriod && session.user.studentId) {
    const [subjectAvgResult, generalAvgResult] = await Promise.all([
      getStudentSubjectAverages(session.user.studentId, selectedPeriod.id),
      calculateGeneralAverage(session.user.studentId, selectedPeriod.id),
    ])

    if (subjectAvgResult.success) {
      subjectAverages = subjectAvgResult.data
    }
    if (generalAvgResult.success) {
      generalAverage = generalAvgResult.data
    }
  }

  const gradesBySubject = grades.reduce((acc, grade) => {
    const subjectName = grade.subject.name
    if (!acc[subjectName]) {
      acc[subjectName] = []
    }
    acc[subjectName].push(grade)
    return acc
  }, {} as Record<string, typeof grades>)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mes notes</h1>
        <p className="text-gray-600 mt-2">Historique de mes notes par matière</p>
      </div>

      {periods.length > 0 && (
        <form method="get" className="mb-6 flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium text-gray-700" htmlFor="period-select">Période</label>
          <select id="period-select" name="periodId" defaultValue={selectedPeriodId} className="border rounded px-3 py-2">
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name} ({period.schoolYear})
              </option>
            ))}
          </select>
          <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Afficher</button>
        </form>
      )}

      {selectedPeriod && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-800 font-medium">Moyenne générale - {selectedPeriod.name}</p>
              <p className="text-2xl font-bold text-blue-900">{generalAverage.toFixed(2)}/20</p>
            </div>
            {session.user.studentId && (
              <DownloadPdfButton
                studentId={session.user.studentId}
                periodId={selectedPeriod.id}
                studentName={studentName}
                periodName={selectedPeriod.name}
              />
            )}
          </div>
        </div>
      )}

      {Object.keys(gradesBySubject).length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500">Aucune note disponible</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(gradesBySubject).map(([subjectName, subjectGrades]) => {
            const subjectAvg = subjectAverages.find((sa) => sa.subjectName === subjectName)
            return (
              <div key={subjectName} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{subjectName}</h2>
                  {subjectAvg && selectedPeriod && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Moyenne ({selectedPeriod.name})</p>
                      <p className="text-lg font-bold text-gray-900">{subjectAvg.average.toFixed(2)}/20</p>
                      <p className="text-xs text-gray-500">Coeff: {subjectAvg.coefficient}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {(subjectGrades as any[]).map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                          {new Date(grade.date).toLocaleDateString("fr-FR")}
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          grade.type === "EXAM" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {grade.type === "EXAM" ? "Examen" : "Journalière"}
                        </span>
                        {grade.comment && (
                          <div className="text-sm text-gray-500 italic">{grade.comment}</div>
                        )}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {grade.value}/20
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
