import { listTracks, deleteTrack } from "@/lib/actions/track"
import { listSchoolGrades } from "@/lib/actions/school-grade"
import Link from "next/link"

export default async function TracksPage() {
  const [tracksResult, gradesResult] = await Promise.all([
    listTracks(),
    listSchoolGrades(),
  ])

  if (!tracksResult.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Séries</h1>
        <div className="text-red-600">{tracksResult.error}</div>
      </div>
    )
  }

  const tracks = tracksResult.data
  const grades = gradesResult.success ? gradesResult.data : []

  // Group tracks by school grade
  const byGrade = tracks.reduce((acc, track) => {
    if (!acc[track.schoolGradeId]) {
      acc[track.schoolGradeId] = []
    }
    acc[track.schoolGradeId].push(track)
    return acc
  }, {} as Record<string, typeof tracks>)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Séries</h1>
        <Link
          href="/admin/academics/tracks/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Créer une série
        </Link>
      </div>

      {Object.entries(byGrade).map(([schoolGradeId, gradeTracks]) => {
        const schoolGrade = grades.find(g => g.id === schoolGradeId)
        if (!schoolGrade) return null

        return (
          <div key={schoolGradeId} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {schoolGrade.name} ({schoolGrade.cycle === "HIGH_SCHOOL" ? "Lycée" : schoolGrade.cycle})
            </h2>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Classes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {gradeTracks.map((track) => (
                    <tr key={track.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        Série {track.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {track.classrooms.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <form action={async () => {
                          "use server"
                          await deleteTrack(track.id)
                        }}>
                          <button
                            type="submit"
                            className="text-red-600 hover:text-red-800"
                            onClick={(e) => {
                              if (!confirm(`Êtes-vous sûr de vouloir supprimer la série ${track.name} ? Cette action est irréversible.`)) {
                                e.preventDefault()
                              }
                            }}
                          >
                            Supprimer
                          </button>
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
        <div className="text-center py-12 text-gray-500">
          Aucune série créée. Les séries sont utilisées pour les niveaux de lycée (à partir de Première).
        </div>
      )}
    </div>
  )
}
