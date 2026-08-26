import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { listTeacherSubjects } from "@/lib/actions/teacher-subject"
import { BookOpen, Users } from "lucide-react"

export default async function TeacherMyClassroomsPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login")
  }

  if (!session.user.teacherId) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-red-600">Erreur : Aucun profil enseignant associé</p>
      </div>
    )
  }

  const subjectsResult = await listTeacherSubjects(session.user.teacherId)

  if (!subjectsResult.success) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-red-600">Erreur : {subjectsResult.error}</p>
      </div>
    )
  }

  const teacherSubjects = subjectsResult.data

  // Group by subject
  const subjectsBySubject = teacherSubjects.reduce((acc: Record<string, typeof teacherSubjects>, ts) => {
    if (!acc[ts.subject.name]) {
      acc[ts.subject.name] = []
    }
    acc[ts.subject.name].push(ts)
    return acc
  }, {})

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mes matières et classes</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Gérez vos classes et matières assignées</p>
      </div>

      {Object.keys(subjectsBySubject).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Aucune matière assignée.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(subjectsBySubject).map(([subjectName, assignments]) => (
            <div key={subjectName} className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/50 px-5 py-4 border-b border-gray-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base font-semibold text-gray-900">{subjectName}</h2>
              </div>
              <div className="p-4 space-y-2.5">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100/80 rounded-lg border border-gray-100 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {assignment.classroom.schoolGrade.name} {assignment.classroom.section}
                      <span className="text-gray-500 text-xs font-normal ml-2">
                        ({assignment.classroom.schoolYear})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                      <Users className="w-3 h-3" />
                      <span>Classe</span>
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
