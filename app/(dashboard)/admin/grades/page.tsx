import { listGradesForAdmin } from "@/lib/actions/grade"
import { listPeriods } from "@/lib/actions/period"
import { listTeachers } from "@/lib/actions/teacher"
import { listSubjects } from "@/lib/actions/subject"
import { listClassrooms } from "@/lib/actions/classroom"
import { GradeFilters } from "@/components/grade-filters"

export default async function AdminGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ classroomId?: string; subjectId?: string; teacherId?: string; periodId?: string; type?: string; startDate?: string; endDate?: string }>
}) {
  const params = await searchParams
  const [gradesResult, classroomsResult, subjectsResult, teachersResult, periodsResult] = await Promise.all([
    listGradesForAdmin({
      classroomId: params.classroomId || undefined,
      subjectId: params.subjectId || undefined,
      teacherId: params.teacherId || undefined,
      periodId: params.periodId || undefined,
      type: (params.type as "EXAM" | "DAILY" | undefined) || undefined,
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
    }),
    listClassrooms(),
    listSubjects(),
    listTeachers(),
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
  const classrooms = classroomsResult.success ? classroomsResult.data : []
  const subjects = subjectsResult.success ? subjectsResult.data : []
  const teachers = teachersResult.success ? teachersResult.data : []
  const periods = periodsResult.success ? periodsResult.data : []

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
        <p className="text-gray-600 mt-2">Vue globale de toutes les notes de l&apos;école</p>
      </div>

      <GradeFilters
        values={{
          classroomId: params.classroomId || undefined,
          subjectId: params.subjectId || undefined,
          teacherId: params.teacherId || undefined,
          periodId: params.periodId || undefined,
          type: (params.type as "EXAM" | "DAILY" | undefined) || undefined,
          startDate: params.startDate || undefined,
          endDate: params.endDate || undefined,
        }}
        classrooms={classrooms.map((classroom) => ({
          id: classroom.id,
          name: `${classroom.schoolGrade.name} ${classroom.section}`,
          schoolYear: classroom.schoolYear,
        }))}
        subjects={subjects}
        teachers={teachers}
        periods={periods}
        mode="admin"
      />

      {/* Grades List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Élève
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Matière
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Classe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enseignant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Note
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {grades.map((grade) => (
              <tr key={grade.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {grade.student.lastName} {grade.student.firstName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{grade.subject.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {grade.classroom.schoolGrade.name} {grade.classroom.section} ({grade.classroom.schoolYear})
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {grade.teacher.lastName} {grade.teacher.firstName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    grade.type === 'EXAM' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {grade.type === 'EXAM' ? 'Examen' : 'Journalière'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{grade.value}/20</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(grade.date).toLocaleDateString('fr-FR')}
                  </div>
                </td>
              </tr>
            ))}
            {grades.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Aucune note
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
