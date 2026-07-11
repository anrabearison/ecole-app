import { listGradesForStudent } from "@/lib/actions/grade"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function StudentGradesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const result = await listGradesForStudent()

  if (!result.success) {
    return (
      <div className="p-8">
        <p className="text-red-600">Error: {result.error}</p>
      </div>
    )
  }

  const grades = result.data

  // Group grades by subject
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

      {Object.keys(gradesBySubject).length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500">Aucune note disponible</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(gradesBySubject).map(([subjectName, subjectGrades]) => (
            <div key={subjectName} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{subjectName}</h2>
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
          ))}
        </div>
      )}
    </div>
  )
}
