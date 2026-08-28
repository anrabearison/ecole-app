import { listPeriods, deletePeriod } from "@/lib/actions/period"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ConfirmActionButton } from "@/components/ConfirmDialog"
import { PaginationClient } from "@/components/PaginationClient"
import { Plus, Eye, Edit, Trash2 } from "lucide-react"

export default async function PeriodsPage({ searchParams }: { searchParams?: { page?: string } }) {
  const params = await searchParams
  const page = parseInt(params?.page || '1', 10) || 1
  const result = await listPeriods({ page, pageSize: 20 })

  if (!result.success) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Périodes</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          Erreur : {result.error}
        </div>
      </div>
    )
  }

  const periods = result.data
  const pagination = result.pagination

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Périodes</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Gestion des trimestres / semestres de l'établissement
          </p>
        </div>
        <Link href="/admin/academics/periods/new" className="self-start sm:self-auto">
          <Button className="gap-2 shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Nouvelle période</span>
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Nom
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Année scolaire
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Ordre
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {periods.map((period) => (
                <tr key={period.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {period.name}
                  </td>
                  <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-sm text-gray-600">
                    {period.schoolYear}
                  </td>
                  <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-sm text-gray-900">
                    {period.order}
                  </td>
                  <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/academics/periods/${period.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Voir</span>
                        </Button>
                      </Link>
                      <form action={deletePeriod as any}>
                        <input type="hidden" name="id" value={period.id} />
                        <ConfirmActionButton
                          message={`Êtes-vous sûr de vouloir supprimer ${period.name} ? Cette action est irréversible.`}
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
              {periods.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                    Aucune période trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
