import { deleteClassroom, listClassrooms } from "@/lib/actions/classroom"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ClassroomDeliberationSection } from "./deliberation-section"
import { ArrowLeft, Pencil, Users, BookOpen } from "lucide-react"

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  if (!session?.user) redirect("/login")

  const result = await listClassrooms()

  if (!result.success) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-red-600">Erreur : {result.error}</p>
      </div>
    )
  }

  const classroom = result.data.find((c) => c.id === id)

  if (!classroom) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-gray-600">Classe non trouvée</p>
        <Link href="/admin/academics/classrooms">
          <Button className="mt-4">Retour</Button>
        </Link>
      </div>
    )
  }

  const cycleNames: Record<string, string> = {
    PRIMARY: "Primaire",
    MIDDLE_SCHOOL: "Collège",
    HIGH_SCHOOL: "Lycée",
  }

  async function handleDelete() {
    "use server"
    const result = await deleteClassroom(id)
    if (result.success) redirect("/admin/academics/classrooms")
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div>
        <Link
          href="/admin/academics/classrooms"
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-2 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux classes</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {classroom.schoolGrade.name}
              {classroom.track ? ` ${classroom.track.name}` : ""} {classroom.section}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{classroom.schoolYear}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/academics/classrooms/${id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pencil className="w-3.5 h-3.5" />
                Modifier
              </Button>
            </Link>
            <form action={handleDelete}>
              <Button variant="destructive" size="sm" type="submit">Supprimer</Button>
            </form>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cycle</p>
          <p className="text-base font-semibold text-gray-900 mt-1">
            {cycleNames[classroom.schoolGrade.cycle] || classroom.schoolGrade.cycle}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Niveau</p>
          <p className="text-base font-semibold text-gray-900 mt-1">{classroom.schoolGrade.name}</p>
        </div>
        {classroom.track && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Série</p>
            <p className="text-base font-semibold text-gray-900 mt-1">Série {classroom.track.name}</p>
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Section</p>
          <p className="text-base font-semibold text-gray-900 mt-1">{classroom.section}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Seuil de passage</p>
          <p className="text-base font-semibold text-indigo-700 mt-1">{classroom.passingThreshold.toFixed(1)}/20</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex items-start gap-3">
          <Users className="w-4 h-4 text-indigo-500 mt-1" />
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Élèves</p>
            <p className="text-base font-semibold text-gray-900 mt-1">{classroom._count.students}</p>
          </div>
        </div>
        {classroom.homeroomTeacher && (
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex items-start gap-3">
            <BookOpen className="w-4 h-4 text-indigo-500 mt-1" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Professeur principal</p>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {classroom.homeroomTeacher.firstName} {classroom.homeroomTeacher.lastName}
              </p>
            </div>
          </div>
        )}
      </div>

      <ClassroomDeliberationSection classroomId={id} schoolYear={classroom.schoolYear} />

      {/* Students placeholder */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Élèves</h2>
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <p className="text-gray-500 text-sm">Aucun élève inscrit pour le moment.</p>
          <p className="text-xs text-gray-400 mt-2">La fonctionnalité de gestion des élèves sera implémentée ultérieurement.</p>
        </div>
      </div>
    </div>
  )
}
