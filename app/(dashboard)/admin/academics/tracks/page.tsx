import { listTracks, deleteTrack } from "@/lib/actions/track"
import { listSchoolGrades } from "@/lib/actions/school-grade"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ConfirmActionButton } from "@/components/ConfirmDialog"
import { PaginationClient } from "@/components/PaginationClient"
import { Plus, Layers } from "lucide-react"

export default async function TracksPage({ searchParams }: { searchParams?: { page?: string } }) {
  const params = await searchParams
  const page = parseInt(params?.page || '1', 10) || 1
  const [tracksResult, gradesResult] = await Promise.all([
    listTracks({ page, pageSize: 20 }),
    listSchoolGrades(),
  ])

  if (!tracksResult.success) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Séries</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {tracksResult.error}
        </div>
      </div>
    )
  }

  const tracks = tracksResult.data
  const grades = gradesResult.success ? gradesResult.data : []
  const pagination = tracksResult.pagination

  // Group tracks by school grade
  const byGrade = tracks.reduce((acc, track) => {
    if (!acc[track.schoolGradeId]) {
      acc[track.schoolGradeId] = []
    }
    acc[track.schoolGradeId].push(track)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Séries</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Gestion des séries d'enseignement (Lycée)
          </p>
        </div>
        <Link href="/admin/academics/tracks/new" className="self-start sm:self-auto">
          <Button className="gap-2 shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Créer une série</span>
          </Button>
        </Link>
      </div>

      {Object.entries(byGrade).map(([schoolGradeId, gradeTracks]) => {
        const schoolGrade = grades.find(g => g.id === schoolGradeId)
        if (!schoolGrade) return null

        return (
          <div key={schoolGradeId} className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="bg-gray-50/50 px-4 py-3.5 sm:px-6 border-b border-gray-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                {schoolGrade.name} ({schoolGrade.cycle === "HIGH_SCHOOL" ? "Lycée" : schoolGrade.cycle})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/30">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                      Nom
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                      Classes
                    </th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {(gradeTracks as any[]).map((track) => (
                    <tr key={track.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-4 sm:px-6 whitespace-nowrap font-medium text-gray-900 text-sm">
                        Série {track.name}
                      </td>
                      <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-sm text-gray-600">
                        {track.classrooms.length} classe(s)
                      </td>
                      <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-right text-sm font-medium">
                        <form action={async () => {
                          "use server"
                          await deleteTrack(track.id)
                        }}>
                          <ConfirmActionButton
                            message={`Êtes-vous sûr de vouloir supprimer la série ${track.name} ? Cette action est irréversible.`}
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
            </div>
          </div>
        )
      })}

      {tracks.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
          Aucune série créée. Les séries sont utilisées pour les niveaux de lycée (à partir de Première).
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
