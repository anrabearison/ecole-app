import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { listTeacherSubjects } from "@/lib/actions/teacher-subject"

export default async function TeacherMyClassroomsPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login")
  }

  if (!session.user.teacherId) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erreur : Aucun profil enseignant associé</p>
      </div>
    )
  }

  const subjectsResult = await listTeacherSubjects(session.user.teacherId)

  if (!subjectsResult.success) {
    return (
      <div className="p-8">
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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mes matières et classes</h1>
        <p className="text-gray-600 mt-2">Gérez vos classes et matières assignées</p>
      </div>

      {Object.keys(subjectsBySubject).length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500">Aucune matière assignée</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(subjectsBySubject).map(([subjectName, assignments]) => (
            <div key={subjectName} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{subjectName}</h2>
              <div className="space-y-2">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="text-gray-900">
                      {assignment.classroom.schoolGrade.name} {assignment.classroom.section}
                      <span className="text-gray-500 ml-2">
                        ({assignment.classroom.schoolYear})
                      </span>
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
