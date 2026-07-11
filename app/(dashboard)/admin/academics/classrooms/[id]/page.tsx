import { deleteClassroom, listClassrooms } from "@/lib/actions/classroom"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const result = await listClassrooms()

  if (!result.success) {
    return (
      <div className="p-8">
        <p className="text-red-600">Error: {result.error}</p>
      </div>
    )
  }

  const classroom = result.data.find((c) => c.id === id)

  if (!classroom) {
    return (
      <div className="p-8">
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
    if (result.success) {
      redirect("/admin/academics/classrooms")
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {classroom.schoolGrade.name}
          {classroom.track ? ` ${classroom.track.name}` : ""} {classroom.section}
        </h1>
        <div className="flex gap-2">
          <Link href="/admin/academics/classrooms">
            <Button variant="outline">Retour</Button>
          </Link>
          <Link href={`/admin/academics/classrooms/${id}/edit`}>
            <Button variant="outline">Modifier</Button>
          </Link>
          <form action={handleDelete}>
            <Button variant="destructive">Supprimer</Button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-500">Cycle</p>
          <p className="text-lg font-medium">{cycleNames[classroom.schoolGrade.cycle] || classroom.schoolGrade.cycle}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Niveau</p>
          <p className="text-lg font-medium">{classroom.schoolGrade.name}</p>
        </div>

        {classroom.track && (
          <div>
            <p className="text-sm text-gray-500">Série</p>
            <p className="text-lg font-medium">Série {classroom.track.name}</p>
          </div>
        )}

        <div>
          <p className="text-sm text-gray-500">Section</p>
          <p className="text-lg font-medium">{classroom.section}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Année scolaire</p>
          <p className="text-lg font-medium">{classroom.schoolYear}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Nombre d'élèves</p>
          <p className="text-lg font-medium">{classroom._count.students}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Élèves</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500">Aucun élève inscrit pour le moment.</p>
          <p className="text-sm text-gray-400 mt-2">La fonctionnalité de gestion des élèves sera implémentée ultérieurement.</p>
        </div>
      </div>
    </div>
  )
}
