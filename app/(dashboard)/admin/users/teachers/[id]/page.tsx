import { listTeachers, deleteTeacher, getTeacherById } from "@/lib/actions/teacher"
import { listTeacherSubjects, assignTeacherSubject, removeTeacherSubject, getSubjects, getClassrooms } from "@/lib/actions/teacher-subject"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { redirect } from "next/navigation"

export default async function TeacherDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error: urlError } = await searchParams
  const [teacherResult, subjectsResult, subjectsListResult, classroomsResult] = await Promise.all([
    getTeacherById(id),
    listTeacherSubjects(id),
    getSubjects(),
    getClassrooms(),
  ])

  const teacher = teacherResult.success ? teacherResult.data : null
  const teacherSubjects = subjectsResult.success ? subjectsResult.data : []
  const subjects = subjectsListResult.success ? subjectsListResult.data : []
  const classrooms = classroomsResult.success ? classroomsResult.data : []

  async function handleDelete() {
    "use server"
    const result = await deleteTeacher(id)
    if (result.success) {
      redirect("/admin/users/teachers")
    }
  }

  async function handleAddSubject(formData: FormData) {
    "use server"
    const subjectId = formData.get("subjectId") as string
    const classroomId = formData.get("classroomId") as string
    
    const result = await assignTeacherSubject({
      teacherId: id,
      subjectId,
      classroomId,
    })

    if (!result.success) {
      redirect(`/admin/users/teachers/${id}?error=${encodeURIComponent(result.error)}`)
    }

    redirect(`/admin/users/teachers/${id}`)
  }

  async function handleRemoveSubject(teacherSubjectId: string) {
    "use server"
    await removeTeacherSubject(teacherSubjectId)
    redirect(`/admin/users/teachers/${id}`)
  }

  if (!teacher) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Enseignant non trouvé</p>
        <Link href="/admin/users/teachers">
          <Button className="mt-4">Retour</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {teacher.firstName} {teacher.lastName}
        </h1>
        <div className="flex gap-2">
          <Link href="/admin/users/teachers">
            <Button variant="outline">Retour</Button>
          </Link>
          <Button variant="outline">Modifier</Button>
          <form action={handleDelete}>
            <Button variant="destructive">Désactiver</Button>
          </form>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Informations
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Matières & classes
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Notes saisies
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Emploi du temps
          </button>
        </nav>
      </div>

      {/* Tab Content: Informations */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Prénom</p>
            <p className="text-lg font-medium">{teacher.firstName}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Nom</p>
            <p className="text-lg font-medium">{teacher.lastName}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-lg font-medium">{teacher.user.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Statut</p>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              teacher.user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {teacher.user.active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">Matières/Classes assignées</p>
          <p className="text-lg font-medium">{teacher._count.subjects} assignation(s)</p>
        </div>
      </div>

      {/* Tab Content: Matières & classes */}
      <div className="mt-8 space-y-6">
        {/* Add Subject Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ajouter une matière et classe</h2>
          {urlError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {decodeURIComponent(urlError)}
            </div>
          )}
          <form action={handleAddSubject} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subjectId">Matière</Label>
                <select
                  id="subjectId"
                  name="subjectId"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                  <option value="">Sélectionner une matière</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="classroomId">Classe</Label>
                <select
                  id="classroomId"
                  name="classroomId"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                  <option value="">Sélectionner une classe</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name} ({classroom.schoolYear})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button type="submit">Ajouter</Button>
          </form>
        </div>

        {/* Teacher Subjects List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignations actuelles</h2>
          {teacherSubjects.length === 0 ? (
            <p className="text-gray-500">Aucune assignation</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matière
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teacherSubjects.map((ts) => (
                  <tr key={ts.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ts.subject.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ts.classroom.schoolGrade.name} {ts.classroom.section} ({ts.classroom.schoolYear})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <form action={handleRemoveSubject.bind(null, ts.id)}>
                        <Button variant="destructive" size="sm" type="submit">
                          Retirer
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Tab Content: Notes saisies (placeholder) */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes saisies</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500">Historique des notes saisies par cet enseignant.</p>
          <p className="text-sm text-gray-400 mt-2">Cette fonctionnalité sera implémentée ultérieurement.</p>
        </div>
      </div>

      {/* Tab Content: Emploi du temps (placeholder) */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Emploi du temps</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500">Emploi du temps de l'enseignant.</p>
          <p className="text-sm text-gray-400 mt-2">Cette fonctionnalité sera implémentée ultérieurement.</p>
        </div>
      </div>
    </div>
  )
}
