import { listGradesForTeacher } from "@/lib/actions/grade"
import { listTeacherSubjects } from "@/lib/actions/teacher-subject"
import { listPeriods } from "@/lib/actions/period"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GradeFilters } from "@/components/grade-filters"

export default async function TeacherGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ classroomId?: string; subjectId?: string; periodId?: string; type?: string }>
}) {
  const params = await searchParams
  const [gradesResult, teacherSubjectsResult, periodsResult] = await Promise.all([
    listGradesForTeacher({
      classroomId: params.classroomId || undefined,
      subjectId: params.subjectId || undefined,
      type: (params.type as "EXAM" | "DAILY" | undefined) || undefined,
      periodId: params.periodId || undefined,
    }),
    listTeacherSubjects(""),
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
  const teacherSubjects = teacherSubjectsResult.success ? teacherSubjectsResult.data : []
  const periods = periodsResult.success ? periodsResult.data : []

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mes notes saisies</h1>
        <Link href="/teacher/grades/new">
          <Button>Saisir des notes</Button>
        </Link>
      </div>

      <GradeFilters
        values={{
          classroomId: params.classroomId || undefined,
          subjectId: params.subjectId || undefined,
          periodId: params.periodId || undefined,
          type: (params.type as "EXAM" | "DAILY" | undefined) || undefined,
        }}
        classrooms={teacherSubjects.map((ts) => ({ id: ts.classroom.id, name: `${ts.classroom.schoolGrade.name} ${ts.classroom.section}`, schoolYear: ts.classroom.schoolYear }))}
        subjects={teacherSubjects.map((ts) => ({ id: ts.subject.id, name: ts.subject.name }))}
        teachers={[]}
        periods={periods}
        mode="teacher"
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
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Aucune note saisie
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
