import Link from "next/link"
import { listSubjects, deleteSubject } from "@/lib/actions/subject"
import { Button } from "@/components/ui/button"
import { ConfirmActionButton } from "@/components/ConfirmDialog"

export const dynamic = "force-dynamic"

export default async function SubjectsPage() {
  const result = await listSubjects()

  if (!result.success) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {result.error}
        </div>
      </div>
    )
  }

  const subjects = result.data

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Matières</h1>
          <p className="text-gray-600 mt-2">Gestion des matières enseignées dans l'établissement</p>
        </div>
        <Link href="/admin/academics/subjects/new">
          <Button>Nouvelle matière</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {subjects.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucune matière configurée.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subjects.map((subject) => (
                <tr key={subject.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <form action={async () => {
                      "use server"
                      await deleteSubject(subject.id)
                    }}>
                      <ConfirmActionButton
                        message={`Êtes-vous sûr de vouloir supprimer ${subject.name} ? Cette action est irréversible.`}
                        confirmLabel="Supprimer"
                        cancelLabel="Annuler"
                        destructive
                        size="sm"
                      >
                        Supprimer
                      </ConfirmActionButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
