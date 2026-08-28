import Link from "next/link"
import { listSubjects, deleteSubject } from "@/lib/actions/subject"
import { Button } from "@/components/ui/button"
import { ConfirmActionButton } from "@/components/ConfirmDialog"
import { PaginationClient } from "@/components/PaginationClient"
import { Plus, Eye, Edit, Trash2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SubjectsPage({ searchParams }: { searchParams?: { page?: string } }) {
  const params = await searchParams
  const page = parseInt(params?.page || '1', 10) || 1
  const result = await listSubjects({ page, pageSize: 20 })

  if (!result.success) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {result.error}
        </div>
      </div>
    )
  }

  const subjects = result.data
  const pagination = result.pagination

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Matières</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {subjects.length} matière(s) configurée(s)
          </p>
        </div>
        <Link href="/admin/academics/subjects/new" className="self-start sm:self-auto">
          <Button className="gap-2 shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Nouvelle matière</span>
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        {subjects.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucune matière configurée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                    Nom de la matière
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-4 sm:px-6">
                      <div className="text-sm font-semibold text-gray-900">{subject.name}</div>
                    </td>
                    <td className="px-4 py-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/academics/subjects/${subject.id}`}>
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Voir</span>
                          </Button>
                        </Link>
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
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Supprimer</span>
                          </ConfirmActionButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
