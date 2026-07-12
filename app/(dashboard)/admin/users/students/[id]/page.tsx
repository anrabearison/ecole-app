import Link from "next/link"
import { getStudentById, getStudentEnrollments } from "@/lib/actions/student"
import { listPeriods } from "@/lib/actions/period"
import { listGradesForStudent } from "@/lib/actions/grade"
import { listScheduleSlotsByClassroom } from "@/lib/actions/schedule-slot"
import { Button } from "@/components/ui/button"
import { ScheduleView } from "@/components/ScheduleView"
import { getStudentSubjectAverages, calculateGeneralAverage } from "@/lib/actions/average"

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; periodId?: string }>
}) {
  const { id } = await params
  const { tab = "info", periodId } = await searchParams
  const activeTab = tab === "schooling" || tab === "grades" || tab === "schedule" ? tab : "info"

  const [studentResult, enrollmentsResult, periodsResult] = await Promise.all([
    getStudentById(id),
    getStudentEnrollments(id),
    listPeriods(),
  ])

  const student = studentResult.success ? studentResult.data : null
  const enrollments = enrollmentsResult.success ? enrollmentsResult.data : []
  const periods = periodsResult.success ? periodsResult.data : []
  const selectedPeriodId = periodId || periods[0]?.id || ""

  let grades: any[] = []
  let subjectAverages: Array<{ subjectId: string; subjectName: string; coefficient: number; average: number }> = []
  let generalAverage = 0
  let scheduleSlots: any[] = []

  if (student?.id && selectedPeriodId) {
    const [gradesResult, averagesResult, generalAverageResult] = await Promise.all([
      listGradesForStudent({ periodId: selectedPeriodId }),
      getStudentSubjectAverages(student.id, selectedPeriodId),
      calculateGeneralAverage(student.id, selectedPeriodId),
    ])

    if (gradesResult.success) {
      grades = gradesResult.data.filter((grade: any) => grade.student.id === student.id)
    }
    if (averagesResult.success) {
      subjectAverages = averagesResult.data
    }
    if (generalAverageResult.success) {
      generalAverage = generalAverageResult.data
    }
  }

  if (student?.classroomId) {
    const scheduleResult = await listScheduleSlotsByClassroom(student.classroomId)
    if (scheduleResult.success) {
      scheduleSlots = scheduleResult.data
    }
  }

  const groupedGrades = grades.reduce((acc: Record<string, typeof grades>, grade: any) => {
    const subjectName = grade.subject.name
    if (!acc[subjectName]) {
      acc[subjectName] = []
    }
    acc[subjectName].push(grade)
    return acc
  }, {})

  if (!student) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Élève non trouvé</p>
        <Link href="/admin/users/students">
          <Button className="mt-4">Retour</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {student.firstName} {student.lastName}
        </h1>
        <div className="flex gap-2">
          <Link href="/admin/users/students">
            <Button variant="outline">Retour</Button>
          </Link>
          <Link href={`/admin/users/students/${id}/edit`}>
            <Button variant="outline">Modifier</Button>
          </Link>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex flex-wrap gap-4" aria-label="Tabs">
          {[
            { key: "info", label: "Informations" },
            { key: "schooling", label: "Classe & scolarité" },
            { key: "grades", label: "Notes" },
            { key: "schedule", label: "Emploi du temps" },
          ].map((tab) => (
            <Link
              key={tab.key}
              href={`/admin/users/students/${id}?tab=${tab.key}`}
              className={`${activeTab === tab.key ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {activeTab === "info" && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Prénom</p>
              <p className="text-lg font-medium">{student.firstName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Nom</p>
              <p className="text-lg font-medium">{student.lastName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg font-medium">{student.user.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Date de naissance</p>
              <p className="text-lg font-medium">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("fr-FR") : "—"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Nom du responsable</p>
              <p className="text-lg font-medium">{student.guardianName || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Téléphone du responsable</p>
              <p className="text-lg font-medium">{student.guardianPhone || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                student.user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                {student.user.active ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Classe actuelle</p>
            <p className="text-lg font-medium">
              {student.classroom
                ? `${student.classroom.schoolGrade.name} ${student.classroom.section} (${student.classroom.schoolYear})`
                : "Non assigné"}
            </p>
          </div>
        </div>
      )}

      {activeTab === "schooling" && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Classe & scolarité</h2>
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Classe actuelle</p>
              <p className="text-lg font-medium">
                {student.classroom
                  ? `${student.classroom.schoolGrade.name} ${student.classroom.section} (${student.classroom.schoolYear})`
                  : "Non assigné"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Historique des inscriptions</p>
              {enrollments.length === 0 ? (
                <p className="text-gray-500">Aucune inscription enregistrée.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {enrollments.map((enrollment) => (
                    <li key={enrollment.id} className="rounded border p-3 text-sm text-gray-700">
                      <span className="font-medium">{enrollment.schoolYear}</span> — {enrollment.classroom.schoolGrade.name} {enrollment.classroom.section}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "grades" && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <form method="get" className="flex flex-wrap items-center gap-4">
              <input type="hidden" name="tab" value="grades" />
              <label className="text-sm font-medium text-gray-700" htmlFor="period-select">Période</label>
              <select id="period-select" name="periodId" defaultValue={selectedPeriodId} className="border rounded px-3 py-2">
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name} ({period.schoolYear})
                  </option>
                ))}
              </select>
              <Button type="submit">Afficher</Button>
            </form>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded border p-4">
                <p className="text-sm text-gray-500">Moyenne générale</p>
                <p className="text-2xl font-semibold text-gray-900">{generalAverage.toFixed(2)}/20</p>
              </div>
              <div className="rounded border p-4">
                <p className="text-sm text-gray-500">Matières</p>
                <p className="text-2xl font-semibold text-gray-900">{subjectAverages.length}</p>
              </div>
            </div>

            {Object.entries(groupedGrades).length === 0 ? (
              <p className="text-gray-500">Aucune note disponible pour cette période.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedGrades).map(([subjectName, subjectGrades]) => {
                  const avg = subjectAverages.find((item) => item.subjectName === subjectName)
                  return (
                    <div key={subjectName} className="rounded border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">{subjectName}</h3>
                        {avg && <p className="text-sm font-medium text-gray-700">Moyenne : {avg.average.toFixed(2)}/20</p>}
                      </div>
                      <div className="space-y-2">
                        {(subjectGrades as any[]).map((grade: any) => (
                          <div key={grade.id} className="flex items-center justify-between rounded bg-gray-50 p-3 text-sm">
                            <span>{new Date(grade.date).toLocaleDateString("fr-FR")}</span>
                            <span>{grade.type === "EXAM" ? "Examen" : "Journalière"}</span>
                            <span className="font-semibold">{grade.value}/20</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Emploi du temps</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            {scheduleSlots.length > 0 ? (
              <ScheduleView slots={scheduleSlots} />
            ) : (
              <p className="text-gray-500">Aucun créneau disponible pour cette classe.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
