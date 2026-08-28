import { listTeachers } from "@/lib/actions/teacher"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PaginationClient } from "@/components/PaginationClient"
import { FilterBar } from "@/components/FilterBar"
import { EmptyState } from "@/components/EmptyState"
import { Plus, Eye } from "lucide-react"

export default async function TeachersPage({ searchParams }: { searchParams?: { search?: string; page?: string; active?: string } }) {
  const session = await auth()
  const params = await searchParams
  const search = typeof params?.search === 'string' ? params.search : undefined
  const page = parseInt(params?.page || '1', 10) || 1
  const active = params?.active === 'true' ? true : params?.active === 'false' ? false : undefined

  if (!session?.user) {
    redirect("/login")
  }

  const result = await listTeachers({ search, page, pageSize: 20, active })

  if (!result.success) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-red-600">Erreur : {result.error}</p>
      </div>
    )
  }

  const teachers = result.data
  const pagination = result.pagination
  const hasActiveFilters = !!search || active !== undefined

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Enseignants</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {pagination ? `${pagination.total} enseignant(s) enregistré(s)` : "Liste des enseignants de l'établissement"}
          </p>
        </div>
        <Link href="/admin/users/teachers/new" className="self-start sm:self-auto">
          <Button className="gap-2 shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Nouvel enseignant</span>
          </Button>
        </Link>
      </div>

      {/* Search Bar & Filters */}
      <FilterBar
        showStatusFilter={true}
        searchPlaceholder="Rechercher par nom, CIN ou email..."
      />

      {/* Table */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Nom & Prénom
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  N° CIN
                </th>
                <th className="hidden sm:table-cell px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Email
                </th>
                <th className="hidden md:table-cell px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Type de contrat
                </th>
                <th className="hidden md:table-cell px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Assignations
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Statut
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-4 sm:px-6">
                    <div className="text-sm font-semibold text-gray-900">
                      {teacher.lastName} {teacher.firstName}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 sm:hidden">
                      {teacher.user.email || "—"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 sm:hidden">
                      {teacher.contractType === "FONCTIONNAIRE" ? "Fonctionnaire" : teacher.contractType === "ENF" ? "ENF" : "—"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 md:hidden">
                      {teacher._count.subjects} assignation(s)
                    </div>
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <div className="text-sm font-mono font-medium text-gray-900">
                      {teacher.nationalIdNumber}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-4 sm:px-6">
                    <div className="text-sm text-gray-600">{teacher.user.email || "—"}</div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-4 sm:px-6">
                    <div className="text-sm text-gray-600">
                      {teacher.contractType === "FONCTIONNAIRE" ? "Fonctionnaire" : teacher.contractType === "ENF" ? "ENF" : "—"}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-4 sm:px-6">
                    <div className="text-sm text-gray-600">
                      {teacher._count.subjects} assignation(s)
                    </div>
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full border ${
                      teacher.user.active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {teacher.user.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-4 sm:px-6 text-right">
                    <Link href={`/admin/users/teachers/${teacher.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Voir</span>
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      type="teachers"
                      hasActiveFilters={hasActiveFilters}
                      resetFiltersHref="/admin/users/teachers"
                      createAction={{ label: "Ajouter un enseignant", href: "/admin/users/teachers/new" }}
                    />
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
