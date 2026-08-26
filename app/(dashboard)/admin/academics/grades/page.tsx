import { listSchoolGrades, deleteSchoolGrade } from "@/lib/actions/school-grade"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ConfirmActionButton } from "@/components/ConfirmDialog"
import { Plus, GraduationCap } from "lucide-react"

export default async function SchoolGradesPage() {
  const result = await listSchoolGrades()

  if (!result.success) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Niveaux scolaires</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{result.error}</div>
      </div>
    )
  }

  const grades = result.data

  // Group by cycle
  const byCycle = grades.reduce((acc, grade) => {
    if (!acc[grade.cycle]) {
      acc[grade.cycle] = []
    }
    acc[grade.cycle].push(grade)
    return acc
  }, {} as Record<string, typeof grades>)

  const cycleLabels: Record<string, string> = {
    PRIMARY: "Primaire",
    MIDDLE_SCHOOL: "Collège",
    HIGH_SCHOOL: "Lycée",
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Niveaux scolaires</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Configuration des niveaux d'enseignement</p>
        </div>
        <Link href="/admin/academics/grades/new" className="self-start sm:self-auto">
          <Button className="gap-2 shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Créer un niveau</span>
          </Button>
        </Link>
      </div>

      {Object.entries(byCycle).map(([cycle, cycleGrades]) => (
        <div key={cycle} className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="bg-gray-50/50 px-4 py-3.5 sm:px-6 border-b border-gray-200 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">{cycleLabels[cycle] || cycle}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/30">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                    Nom
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                    Ordre
                  </th>
                  <th className="hidden md:table-cell px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                    Séries
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
                {cycleGrades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {grade.name}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-4 sm:px-6 whitespace-nowrap text-sm text-gray-600">
                      {grade.order}
                    </td>
                    <td className="hidden md:table-cell px-4 py-4 sm:px-6 whitespace-nowrap text-sm text-gray-600">
                      {grade.tracks.length > 0 ? grade.tracks.map(t => t.name).join(", ") : "-"}
                    </td>
                    <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-sm text-gray-600">
                      {grade.classrooms.length} classe(s)
                    </td>
                    <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-right text-sm font-medium">
                      <form action={async () => {
                        "use server"
                        await deleteSchoolGrade(grade.id)
                      }}>
                        <ConfirmActionButton
                          message={`Êtes-vous sûr de vouloir supprimer le niveau ${grade.name} ? Cette action est irréversible.`}
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
      ))}

      {grades.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 text-sm">
          Aucun niveau scolaire créé. Créez le premier niveau pour commencer.
        </div>
      )}
    </div>
  )
}
