import { getCoefficientsMatrix } from "@/lib/actions/subject-coefficient"
import { CoefficientsManager } from "./_components/CoefficientsManager"

export const dynamic = "force-dynamic"

export default async function CoefficientsPage() {
  const result = await getCoefficientsMatrix()

  if (!result.success) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          Erreur : {result.error}
        </div>
      </div>
    )
  }

  const { grades, subjects, coefficients } = result.data

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Coefficients des Matières</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Définissez les coefficients par niveau (6ème à Seconde) et par série pour les classes de Première et Terminale.
          </p>
        </div>
      </div>

      {/* Interactive Coefficients Manager */}
      <CoefficientsManager grades={grades} subjects={subjects} initialCoefficients={coefficients} />
    </div>
  )
}
