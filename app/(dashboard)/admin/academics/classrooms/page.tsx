import { listClassrooms } from "@/lib/actions/classroom"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PaginationClient } from "@/components/PaginationClient"
import { FilterBar } from "@/components/FilterBar"
import { Plus, Users, Eye, Edit, Trash2 } from "lucide-react"

export default async function ClassroomsPage({ searchParams }: { searchParams?: { search?: string; page?: string } }) {
  const params = await searchParams
  const search = typeof params?.search === 'string' ? params.search : undefined
  const page = parseInt(params?.page || '1', 10) || 1
  const result = await listClassrooms({ search, page, pageSize: 20 })

  if (!result.success) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-red-600">Erreur : {result.error}</p>
      </div>
    )
  }

  const classrooms = result.data
  const pagination = result.pagination

  const groupedByCycle = classrooms.reduce((acc, classroom) => {
    const cycle = classroom.schoolGrade.cycle
    if (!acc[cycle]) acc[cycle] = {}
    const schoolGrade = classroom.schoolGrade.name
    if (!acc[cycle][schoolGrade]) acc[cycle][schoolGrade] = []
    acc[cycle][schoolGrade].push(classroom)
    return acc
  }, {} as Record<string, Record<string, any[]>>)

  const cycleNames: Record<string, string> = {
    PRIMARY: "Primaire",
    MIDDLE_SCHOOL: "Collège",
    HIGH_SCHOOL: "Lycée",
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {pagination ? `${pagination.total} classe(s)` : "Vue arborescente des classes"}
          </p>
        </div>
        <Link href="/admin/academics/classrooms/new" className="self-start sm:self-auto">
          <Button className="gap-2 shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Nouvelle classe</span>
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
        <FilterBar
          searchPlaceholder="Rechercher une classe..."
          standalone={true}
        />
      </div>

      {/* Tree View */}
      <div className="space-y-6">
        {Object.entries(groupedByCycle).map(([cycle, grades]) => (
          <div key={cycle} className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="bg-gray-50/50 px-4 py-3.5 sm:px-6 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                {cycleNames[cycle] || cycle}
              </h2>
            </div>
            <div className="p-4 sm:p-6 space-y-5">
              {Object.entries(grades as Record<string, any[]>).map(([gradeName, classroomsInGrade]) => (
                <div key={gradeName}>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                    {gradeName}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {classroomsInGrade.map((classroom: any) => (
                      <Link
                        key={classroom.id}
                        href={`/admin/academics/classrooms/${classroom.id}`}
                        className="flex items-center justify-between bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg p-3.5 transition-colors group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">
                            {classroom.schoolGrade.name}
                            {classroom.track ? ` ${classroom.track.name}` : ""} {classroom.section}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{classroom.schoolYear}</div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full px-2.5 py-1 ml-2 shrink-0">
                          <Users className="w-3.5 h-3.5" />
                          <span>{classroom._count.students}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {classrooms.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
          Aucune classe créée pour le moment.
        </div>
      )}

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
