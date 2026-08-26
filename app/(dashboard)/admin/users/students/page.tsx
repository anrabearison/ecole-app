import { listStudents } from "@/lib/actions/student"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PaginationClient } from "@/components/PaginationClient"
import { Plus, Search } from "lucide-react"

export default async function StudentsPage({ searchParams }: { searchParams?: { search?: string; page?: string } }) {
  const session = await auth()
  const params = await searchParams
  const search = typeof params?.search === 'string' ? params.search : undefined
  const page = parseInt(params?.page || '1', 10) || 1

  if (!session?.user) {
    redirect("/login")
  }

  const result = await listStudents({ search, page, pageSize: 20 })

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

      {/* Search Bar */}
      <form method="get" action="/admin/users/students">
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              name="search"
              defaultValue={search || ""}
              placeholder="Rechercher un élève..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <input type="hidden" name="page" value="1" />
          <Button type="submit" variant="outline">Rechercher</Button>
        </div>
      </form>

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
                      <Button variant="outline" size="sm">Voir</Button>
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
