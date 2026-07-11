import { listStudents, deleteStudent, getClassrooms, getStudentById } from "@/lib/actions/student"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const [studentResult, classroomsResult] = await Promise.all([
    getStudentById(id),
    getClassrooms(),
  ])

  const student = studentResult.success ? studentResult.data : null
  const classrooms = classroomsResult.success ? classroomsResult.data : []

  async function handleDelete() {
    "use server"
    const result = await deleteStudent(id)
    if (result.success) {
      redirect("/admin/users/students")
    }
  }

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
            Classe & scolarité
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Notes
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
            <p className="text-sm text-gray-500">Statut</p>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              student.user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {student.user.active ? 'Actif' : 'Inactif'}
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

      {/* Tab Content: Classe & scolarité (placeholder) */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Classe & scolarité</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500">Historique des inscriptions par année scolaire.</p>
          <p className="text-sm text-gray-400 mt-2">Cette fonctionnalité sera implémentée ultérieurement.</p>
        </div>
      </div>

      {/* Tab Content: Notes (placeholder) */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500">Notes de l'élève, groupées par matière.</p>
          <p className="text-sm text-gray-400 mt-2">Cette fonctionnalité sera implémentée ultérieurement.</p>
        </div>
      </div>

      {/* Tab Content: Emploi du temps (placeholder) */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Emploi du temps</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500">Emploi du temps de la classe de l'élève.</p>
          <p className="text-sm text-gray-400 mt-2">Cette fonctionnalité sera implémentée ultérieurement.</p>
        </div>
      </div>
    </div>
  )
}
