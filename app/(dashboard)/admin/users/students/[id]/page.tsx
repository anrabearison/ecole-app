import Link from "next/link"
import { getStudentById, getStudentEnrollments } from "@/lib/actions/student"
import { listPeriods } from "@/lib/actions/period"
import { listGradesForStudent } from "@/lib/actions/grade"
import { listScheduleSlotsByClassroom } from "@/lib/actions/schedule-slot"
import { Button } from "@/components/ui/button"
import { ScheduleView } from "@/components/ScheduleView"
import { getStudentSubjectAverages, calculateGeneralAverage } from "@/lib/actions/average"
import { ArrowLeft, Pencil, CheckCircle2, AlertCircle } from "lucide-react"

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
    if (averagesResult.success) subjectAverages = averagesResult.data
    if (generalAverageResult.success) generalAverage = generalAverageResult.data
  }

  if (student?.classroom?.id) {
    const scheduleResult = await listScheduleSlotsByClassroom(student.classroom.id)
    if (scheduleResult.success) scheduleSlots = scheduleResult.data
  }

  const groupedGrades = grades.reduce((acc: Record<string, typeof grades>, grade: any) => {
    const subjectName = grade.subject.name
    if (!acc[subjectName]) acc[subjectName] = []
    acc[subjectName].push(grade)
    return acc
  }, {})

  if (!student) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-gray-600">Élève non trouvé</p>
        <Link href="/admin/users/students"><Button className="mt-4">Retour</Button></Link>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div>
        <Link
          href="/admin/users/students"
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-2 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {student.firstName ? `${student.firstName} ${student.lastName}` : student.lastName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Matricule : {student.registrationNumber}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href={`/admin/users/students/${id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pencil className="w-3.5 h-3.5" />
                Modifier
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex overflow-x-auto gap-1 scrollbar-none" aria-label="Tabs">
          {[
            { key: "info", label: "Informations" },
            { key: "schooling", label: "Scolarité" },
            { key: "grades", label: "Notes" },
            { key: "schedule", label: "Emploi du temps" },
          ].map((tabItem) => (
            <Link
              key={tabItem.key}
              href={`/admin/users/students/${id}?tab=${tabItem.key}`}
              className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm shrink-0 transition-colors ${
                activeTab === tabItem.key
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tabItem.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Tab: Informations */}
      {activeTab === "info" && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {[
              { label: "Prénom", value: student.firstName || "—" },
              { label: "Nom", value: student.lastName },
              { label: "Email", value: student.user.email || "—" },
              { label: "Numéro matricule", value: student.registrationNumber },
              { label: "Sexe", value: student.sex === "MALE" ? "Masculin" : student.sex === "FEMALE" ? "Féminin" : "—" },
              {
                label: "Statut scolaire",
                value: student.status === "PASSING" ? "Passant" : student.status === "REPEATING" ? "Redoublant" : "Triplant",
              },
              {
                label: "Date de naissance",
                value: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("fr-FR") : "—",
              },
              { label: "Lieu de naissance", value: student.placeOfBirth || "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-base font-medium text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Statut du compte</p>
              <span className={`inline-flex items-center gap-1 mt-0.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                student.user.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
              }`}>
                {student.user.active ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {student.user.active ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-5 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Responsable légal / Tuteur</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du tuteur</p>
                <p className="text-base font-medium text-gray-900 mt-0.5">{student.guardianName || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone du tuteur</p>
                <p className="text-base font-medium text-gray-900 mt-0.5">{student.guardianPhone || "—"}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Classe actuelle</p>
            <p className="text-base font-medium text-gray-900 mt-0.5">
              {student.classroom
                ? `${student.classroom.schoolGrade.name} ${student.classroom.section} (${student.classroom.schoolYear})`
                : "Non assigné"}
            </p>
          </div>
        </div>
      )}

      {/* Tab: Scolarité */}
      {activeTab === "schooling" && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 space-y-5">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Classe actuelle</p>
            <p className="text-base font-medium text-gray-900 mt-0.5">
              {student.classroom
                ? `${student.classroom.schoolGrade.name} ${student.classroom.section} (${student.classroom.schoolYear})`
                : "Non assigné"}
            </p>
          </div>
          {student.classroom?.homeroomTeachers && student.classroom.homeroomTeachers.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Professeurs principaux ({student.classroom.homeroomTeachers.length})
              </p>
              <div className="mt-1 space-y-1">
                {student.classroom.homeroomTeachers.map((ht) => (
                  <p key={ht.id} className="text-sm font-medium text-gray-900">
                    {ht.isPrimary && <span className="text-indigo-600 mr-1">★</span>}
                    {ht.teacher.firstName ? `${ht.teacher.firstName} ${ht.teacher.lastName}` : ht.teacher.lastName}
                  </p>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Historique des inscriptions</p>
            {enrollments.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucune inscription enregistrée.</p>
            ) : (
              <div className="space-y-2">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 bg-gray-50">
                    <span className="font-semibold">{enrollment.schoolYear}</span>
                    {" — "}{enrollment.classroom.schoolGrade.name} {enrollment.classroom.section}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Notes */}
      {activeTab === "grades" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6">
            <form method="get" className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="tab" value="grades" />
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="period-select">
                  Période
                </label>
                <select
                  id="period-select"
                  name="periodId"
                  defaultValue={selectedPeriodId}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name} ({period.schoolYear})
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" size="sm">Afficher</Button>
            </form>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Moyenne générale</p>
              <p className={`text-3xl font-bold mt-1 ${generalAverage >= 10 ? "text-emerald-600" : "text-rose-600"}`}>
                {generalAverage.toFixed(2)}<span className="text-base font-normal text-gray-400">/20</span>
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Matières évaluées</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{subjectAverages.length}</p>
            </div>
          </div>

          {Object.entries(groupedGrades).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              Aucune note disponible pour cette période.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedGrades).map(([subjectName, subjectGrades]) => {
                const avg = subjectAverages.find((item) => item.subjectName === subjectName)
                return (
                  <div key={subjectName} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="bg-gray-50/50 px-5 py-3.5 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-base font-semibold text-gray-900">{subjectName}</h3>
                      {avg && (
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                          avg.average >= 10 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}>
                          Moy. {avg.average.toFixed(2)}/20
                        </span>
                      )}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {(subjectGrades as any[]).map((grade: any) => (
                        <div key={grade.id} className="flex items-center justify-between px-5 py-3 text-sm">
                          <span className="text-gray-600">{new Date(grade.date).toLocaleDateString("fr-FR")}</span>
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                            grade.type === "EXAM"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}>
                            {grade.type === "EXAM" ? "Examen" : "Journalière"}
                          </span>
                          <span className={`font-bold ${grade.value >= 10 ? "text-emerald-700" : "text-rose-700"}`}>
                            {grade.value}/20
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Emploi du temps */}
      {activeTab === "schedule" && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6">
          {scheduleSlots.length > 0 ? (
            <div className="overflow-x-auto">
              <ScheduleView slots={scheduleSlots} />
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucun créneau disponible pour cette classe.</p>
          )}
        </div>
      )}
    </div>
  )
}
