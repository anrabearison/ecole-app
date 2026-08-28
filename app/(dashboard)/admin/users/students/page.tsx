import { listStudents } from "@/lib/actions/student"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PaginationClient } from "@/components/PaginationClient"
import { Eye, Plus, Search, CheckCircle2, XCircle } from "lucide-react"

export default async function StudentsPage({ searchParams }: { searchParams?: { search?: string; page?: string; active?: string } }) {
  const session = await auth()
  const params = await searchParams
  const search = typeof params?.search === 'string' ? params.search : undefined
  const page = parseInt(params?.page || '1', 10) || 1
  const active = params?.active === 'true' ? true : params?.active === 'false' ? false : undefined

  if (!session?.user) {
    redirect("/login")
  }

  const result = await listStudents({ search, page, pageSize: 20, active })

  if (!result.success) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-red-600">Erreur : {result.error}</p>
      </div>
    )
  }

  const students = result.data
  const pagination = result.pagination

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Élèves</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {pagination ? `${pagination.total} élève(s) enregistré(s)` : "Liste des élèves de l'établissement"}
          </p>
        </div>
        <Link href="/admin/users/students/new" className="self-start sm:self-auto">
          <Button className="gap-2 shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Nouvel élève</span>
          </Button>
        </Link>
      </div>

      {/* Search Bar & Filters */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Section */}
          <form method="get" action="/admin/users/students" className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              name="search"
              defaultValue={search || ""}
              placeholder="Rechercher par nom ou email..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {active !== undefined && <input type="hidden" name="active" value={active ? "true" : "false"} />}
            <input type="hidden" name="page" value="1" />
          </form>

          {/* Status Filter Section */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Statut :</span>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <Link
                href={`/admin/users/students${search ? `?search=${encodeURIComponent(search)}` : ''}`}
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  active === undefined
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Tous
              </Link>
              <Link
                href={`/admin/users/students?active=true${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  active === true
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Actif
              </Link>
              <Link
                href={`/admin/users/students?active=false${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  active === false
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                Inactif
              </Link>
            </div>

            {(search || active !== undefined) && (
              <Link href="/admin/users/students" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                ✕ Réinitialiser
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Nom
                </th>
                <th className="hidden sm:table-cell px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Email
                </th>
                <th className="hidden md:table-cell px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                  Classe
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
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-4 sm:px-6">
                    <div className="text-sm font-semibold text-gray-900">
                      {student.lastName} {student.firstName}
                    </div>
                    {/* Email visible only on mobile */}
                    <div className="text-xs text-gray-500 mt-0.5 sm:hidden">
                      {student.user.email || "—"}
                    </div>
                    {/* Classroom visible only on mobile/tablet */}
                    <div className="text-xs text-gray-500 mt-0.5 md:hidden">
                      {student.classroom
                        ? `${student.classroom.schoolGrade.name} ${student.classroom.section}`
                        : "Non assigné"}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-4 sm:px-6">
                    <div className="text-sm text-gray-600">{student.user.email || "—"}</div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-4 sm:px-6">
                    <div className="text-sm text-gray-600">
                      {student.classroom
                        ? `${student.classroom.schoolGrade.name} ${student.classroom.section} (${student.classroom.schoolYear})`
                        : "Non assigné"}
                    </div>
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full border ${
                      student.user.active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {student.user.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-4 sm:px-6 text-right">
                    <Link href={`/admin/users/students/${student.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Voir</span>
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Aucun élève trouvé.
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
