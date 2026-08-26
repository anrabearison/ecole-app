import { listGradesForTeacher } from "@/lib/actions/grade"
import { listTeacherSubjects } from "@/lib/actions/teacher-subject"
import { listPeriods } from "@/lib/actions/period"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GradeFilters } from "@/components/grade-filters"
import { PaginationClient } from "@/components/PaginationClient"
import { Plus, CheckCircle2, AlertCircle } from "lucide-react"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function TeacherGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ classroomId?: string; subjectId?: string; periodId?: string; type?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const params = await searchParams
  const [gradesResult, teacherSubjectsResult, periodsResult] = await Promise.all([
    listGradesForTeacher({
      classroomId: params.classroomId || undefined,
      subjectId: params.subjectId || undefined,
      type: (params.type as "EXAM" | "DAILY" | undefined) || undefined,
      periodId: params.periodId || undefined,
      page: parseInt(params.page || '1', 10) || 1,
      pageSize: 20,
    }),
    listTeacherSubjects(session.user.teacherId || undefined),
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
  const pagination = gradesResult.pagination
  const teacherSubjects = teacherSubjectsResult.success ? teacherSubjectsResult.data : []
  const periods = periodsResult.success ? periodsResult.data : []

  const classroomMap = new Map<string, { id: string; name: string; schoolYear: string }>()
  const subjectMap = new Map<string, { id: string; name: string }>()

  teacherSubjects.forEach((ts) => {
    if (!classroomMap.has(ts.classroom.id)) {
      classroomMap.set(ts.classroom.id, {
        id: ts.classroom.id,
        name: `${ts.classroom.schoolGrade.name} ${ts.classroom.section}`,
        schoolYear: ts.classroom.schoolYear,
      })
    }
    if (!subjectMap.has(ts.subject.id)) {
      subjectMap.set(ts.subject.id, {
        id: ts.subject.id,
        name: ts.subject.name,
      })
    }
  })

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes notes saisies</h1>
          <p className="text-gray-600 mt-1">Consultez et gérez les évaluations saisies pour vos classes.</p>
        </div>
        <Link href="/teacher/grades/new">
          <Button className="gap-2 shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Saisir des notes</span>
          </Button>
        </Link>
      </div>

      <GradeFilters
        values={{
          classroomId: params.classroomId || undefined,
          subjectId: params.subjectId || undefined,
          periodId: params.periodId || undefined,
          type: (params.type as "EXAM" | "DAILY" | undefined) || undefined,
        }}
        classrooms={Array.from(classroomMap.values())}
        subjects={Array.from(subjectMap.values())}
        teachers={[]}
        periods={periods}
        mode="teacher"
      />

      {/* Grades List Table */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Élève
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Matière
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Classe
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Note
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {grades.map((grade) => {
              const isPassing = grade.value >= 10
              return (
                <tr key={grade.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {grade.student.lastName} {grade.student.firstName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-700">{grade.subject.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {grade.classroom.schoolGrade.name} {grade.classroom.section}
                    </div>
                    <div className="text-xs text-gray-400">{grade.classroom.schoolYear}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                      grade.type === 'EXAM' 
                        ? 'bg-purple-50 text-purple-700 border-purple-200' 
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {grade.type === 'EXAM' ? 'Examen' : 'Journalière'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-md ${
                      isPassing 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {isPassing ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {grade.value} / 20
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(grade.date).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              )
            })}
            {grades.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Aucune note saisie avec les filtres sélectionnés.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
