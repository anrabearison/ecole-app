import Link from "next/link"
import { deleteTeacher, getTeacherById } from "@/lib/actions/teacher"
import { listTeacherSubjects, getSubjects, getClassrooms } from "@/lib/actions/teacher-subject"
import { listGradesForAdmin } from "@/lib/actions/grade"
import { listScheduleSlotsByTeacher } from "@/lib/actions/schedule-slot"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScheduleView } from "@/components/ScheduleView"
import { redirect } from "next/navigation"
import { ConfirmActionButton } from "@/components/ConfirmDialog"
import { ArrowLeft, Pencil, CheckCircle2, AlertCircle } from "lucide-react"

export default async function TeacherDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; error?: string }>
}) {
  const { id } = await params
  const { tab = "info", error } = await searchParams
  const activeTab = tab === "subjects" || tab === "grades" || tab === "schedule" ? tab : "info"

  const [teacherResult, subjectsResult, subjectsListResult, classroomsResult, gradesResult, scheduleResult] = await Promise.all([
    getTeacherById(id),
    listTeacherSubjects(id),
    getSubjects(),
    getClassrooms(),
    listGradesForAdmin({ teacherId: id }),
    listScheduleSlotsByTeacher(id),
  ])

  const teacher = teacherResult.success ? teacherResult.data : null
  const teacherSubjects = subjectsResult.success ? subjectsResult.data : []
  const subjects = subjectsListResult.success ? subjectsListResult.data : []
  const classrooms = classroomsResult.success ? classroomsResult.data : []
  const grades = gradesResult.success ? gradesResult.data : []
  const scheduleSlots = scheduleResult.success ? scheduleResult.data : []

  async function handleDelete() {
    "use server"
    const result = await deleteTeacher(id)
    if (result.success) redirect("/admin/users/teachers")
  }

  if (!teacher) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-gray-600">Enseignant non trouvé</p>
        <Link href="/admin/users/teachers"><Button className="mt-4">Retour</Button></Link>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div>
        <Link
          href="/admin/users/teachers"
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-2 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {teacher.firstName} {teacher.lastName}
            </h1>
            {teacher.registrationNumber && (
              <p className="text-sm text-gray-500 mt-1">Matricule : {teacher.registrationNumber}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/users/teachers/${id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pencil className="w-3.5 h-3.5" />
                Modifier
              </Button>
            </Link>
            <form action={handleDelete}>
              <ConfirmActionButton
                message={`Êtes-vous sûr de vouloir désactiver ${teacher.firstName} ${teacher.lastName} ? Cette action désactivera son compte.`}
                confirmLabel="Désactiver"
                cancelLabel="Annuler"
                destructive
              >
                Désactiver
              </ConfirmActionButton>
            </form>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex overflow-x-auto gap-1 scrollbar-none" aria-label="Tabs">
          {[
            { key: "info", label: "Informations" },
            { key: "subjects", label: "Matières & classes" },
            { key: "grades", label: "Notes saisies" },
            { key: "schedule", label: "Emploi du temps" },
          ].map((tabItem) => (
            <Link
              key={tabItem.key}
              href={`/admin/users/teachers/${id}?tab=${tabItem.key}`}
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
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {[
              { label: "Prénom", value: teacher.firstName },
              { label: "Nom", value: teacher.lastName },
              { label: "Email", value: teacher.user.email || "—" },
              { label: "Numéro matricule", value: teacher.registrationNumber || "—" },
              { label: "Numéro CIN", value: teacher.nationalIdNumber || "—" },
              { label: "Sexe", value: teacher.sex === "MALE" ? "Masculin" : "Féminin" },
              { label: "Téléphone", value: teacher.phone || "—" },
              { label: "Type de contrat", value: teacher.contractType || "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-base font-medium text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</p>
              <span className={`inline-flex items-center gap-1 mt-0.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                teacher.user.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
              }`}>
                {teacher.user.active ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {teacher.user.active ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assignations</p>
            <p className="text-base font-medium text-gray-900 mt-0.5">{teacher._count.subjects} matière(s)/classe(s) assignée(s)</p>
          </div>
        </div>
      )}

      {/* Tab: Matières & Classes */}
      {activeTab === "subjects" && (
        <div className="space-y-5">
          {/* Add assignment */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Ajouter une assignation</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <form action={async (formData: FormData) => {
              "use server"
              const subjectId = formData.get("subjectId") as string
              const classroomId = formData.get("classroomId") as string
              const result = await (await import("@/lib/actions/teacher-subject")).assignTeacherSubject({ teacherId: id, subjectId, classroomId })
              if (!result.success) redirect(`/admin/users/teachers/${id}?tab=subjects&error=${encodeURIComponent(result.error)}`)
              redirect(`/admin/users/teachers/${id}?tab=subjects`)
            }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subjectId" className="text-xs font-medium text-gray-700 uppercase tracking-wider">Matière</Label>
                  <select
                    id="subjectId"
                    name="subjectId"
                    className="mt-1 block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Sélectionner une matière</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="classroomId" className="text-xs font-medium text-gray-700 uppercase tracking-wider">Classe</Label>
                  <select
                    id="classroomId"
                    name="classroomId"
                    className="mt-1 block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Sélectionner une classe</option>
                    {classrooms.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>{classroom.name} ({classroom.schoolYear})</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" size="sm">Ajouter</Button>
            </form>
          </div>

          {/* Existing assignments */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-base font-semibold text-gray-900">Assignations actuelles</h2>
            </div>
            {teacherSubjects.length === 0 ? (
              <p className="text-gray-500 text-sm p-5">Aucune assignation.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">Matière</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">Classe</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teacherSubjects.map((ts) => (
                      <tr key={ts.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3.5 text-sm text-gray-900 sm:px-6">{ts.subject.name}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-600 sm:px-6">
                          {ts.classroom.schoolGrade.name} {ts.classroom.section} ({ts.classroom.schoolYear})
                        </td>
                        <td className="px-4 py-3.5 text-right sm:px-6">
                          <form action={async () => {
                            "use server"
                            await (await import("@/lib/actions/teacher-subject")).removeTeacherSubject(ts.id)
                            redirect(`/admin/users/teachers/${id}?tab=subjects`)
                          }}>
                            <Button variant="destructive" size="sm" type="submit">Retirer</Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Notes */}
      {activeTab === "grades" && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-base font-semibold text-gray-900">Notes saisies</h2>
          </div>
          <div className="p-5 sm:p-6">
            {grades.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucune note saisie par cet enseignant.</p>
            ) : (
              <div className="space-y-2">
                {grades.map((grade) => (
                  <div key={grade.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-gray-200 p-3.5 bg-gray-50 text-sm">
                    <div>
                      <p className="font-semibold text-gray-900">{grade.student.lastName} {grade.student.firstName}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{grade.subject.name} · {grade.classroom.schoolGrade.name} {grade.classroom.section}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-500">{new Date(grade.date).toLocaleDateString("fr-FR")}</span>
                      <span className={`font-bold text-base ${grade.value >= 10 ? "text-emerald-700" : "text-rose-700"}`}>
                        {grade.value}/20
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            <p className="text-gray-500 text-center py-8">Aucun créneau disponible pour cet enseignant.</p>
          )}
        </div>
      )}
    </div>
  )
}
