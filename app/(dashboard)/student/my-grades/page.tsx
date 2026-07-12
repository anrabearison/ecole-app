import { listGradesForStudent } from "@/lib/actions/grade"
import { listPeriods } from "@/lib/actions/period"
import { getStudentSubjectAverages, calculateGeneralAverage } from "@/lib/actions/average"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function StudentGradesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

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

  // Get the first period for averages (in a real app, this would be user-selectable)
  const selectedPeriod = periods.length > 0 ? periods[0] : null

  // Group grades by subject
  const gradesBySubject = grades.reduce((acc, grade) => {
    const subjectName = grade.subject.name
    if (!acc[subjectName]) {
      acc[subjectName] = []
    }
    acc[subjectName].push(grade)
    return acc
  }, {} as Record<string, typeof grades>)

  // Get subject averages if a period is selected
  let subjectAverages: Array<{ subjectId: string; subjectName: string; coefficient: number; average: number }> = []
  let generalAverage = 0

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

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mes notes</h1>
        <p className="text-gray-600 mt-2">Historique de mes notes par matière</p>
      </div>

      {selectedPeriod && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-800 font-medium">Moyenne générale - {selectedPeriod.name}</p>
              <p className="text-2xl font-bold text-blue-900">{generalAverage.toFixed(2)}/20</p>
            </div>
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
                  {subjectGrades.map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                          {new Date(grade.date).toLocaleDateString('fr-FR')}
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          grade.type === 'EXAM' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {grade.type === 'EXAM' ? 'Examen' : 'Journalière'}
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
