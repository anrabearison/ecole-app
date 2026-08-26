import { listGradesForAdmin } from "@/lib/actions/grade"
import { listPeriods } from "@/lib/actions/period"
import { listTeachers } from "@/lib/actions/teacher"
import { listSubjects } from "@/lib/actions/subject"
import { listClassrooms } from "@/lib/actions/classroom"
import { GradeFilters } from "@/components/grade-filters"
import { PaginationClient } from "@/components/PaginationClient"
import { Award, CheckCircle2, AlertCircle } from "lucide-react"

export default async function AdminGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ classroomId?: string; subjectId?: string; teacherId?: string; periodId?: string; type?: string; startDate?: string; endDate?: string; page?: string }>
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
      page: parseInt(params.page || '1', 10) || 1,
      pageSize: 20,
    }),
    listClassrooms({ page: 1, pageSize: 1000 }),
    listSubjects({ page: 1, pageSize: 1000 }),
    listTeachers({ page: 1, pageSize: 1000 }),
    listPeriods({ page: 1, pageSize: 1000 }),
  ])

  if (!gradesResult.success) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-red-600">Erreur : {gradesResult.error}</p>
      </div>
    )
  }

  const grades = gradesResult.data
  const pagination = gradesResult.pagination
  const classrooms = classroomsResult.success ? classroomsResult.data : []
  const subjects = subjectsResult.success ? subjectsResult.data : []
  const teachers = teachersResult.success ? teachersResult.data : []
  const periods = periodsResult.success ? periodsResult.data : []

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notes & Évaluations</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Vue globale de toutes les notes attribuées aux élèves de l'école.</p>
        </div>
        {pagination && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3.5 py-2 text-indigo-700 font-medium text-xs sm:text-sm self-start sm:self-auto flex items-center gap-2">
            <Award className="w-4 h-4 shrink-0" />
            <span>{pagination.total} notes au total</span>
          </div>
        )}
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

      {/* Grades List Table */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Élève
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Matière
                </th>
                <th className="hidden sm:table-cell px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Classe
                </th>
                <th className="hidden md:table-cell px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Enseignant
                </th>
                <th className="hidden lg:table-cell px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Type
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Note
                </th>
                <th className="hidden sm:table-cell px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grades.map((grade) => {
                const isPassing = grade.value >= 10
                return (
                  <tr key={grade.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-4 sm:px-6">
                      <div className="text-sm font-semibold text-gray-900">
                        {grade.student.lastName} {grade.student.firstName}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 sm:hidden">
                        {grade.classroom.schoolGrade.name} {grade.classroom.section}
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <div className="text-sm font-medium text-gray-700">{grade.subject.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 lg:hidden">
                        {grade.type === 'EXAM' ? 'Examen' : 'Journalière'}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-4 sm:px-6">
                      <div className="text-sm text-gray-600">
                        {grade.classroom.schoolGrade.name} {grade.classroom.section}
                      </div>
                      <div className="text-xs text-gray-400">{grade.classroom.schoolYear}</div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-4 sm:px-6">
                      <div className="text-sm text-gray-600">
                        {grade.teacher.lastName} {grade.teacher.firstName}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-4 sm:px-6">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        grade.type === 'EXAM' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {grade.type === 'EXAM' ? 'Examen' : 'Journalière'}
                      </span>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <span className={`inline-flex items-center gap-1 text-xs sm:text-sm font-bold px-2.5 py-1 rounded-md ${
                        isPassing 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {isPassing ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                        {grade.value} / 20
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-4 sm:px-6 text-sm text-gray-500">
                      {new Date(grade.date).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                )
              })}
              {grades.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Aucune note trouvée avec les filtres sélectionnés.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && (
        <PaginationClient
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
        />
      )}
    </div>
  )
}
