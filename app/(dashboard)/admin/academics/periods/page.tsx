import { listPeriods, deletePeriod } from "@/lib/actions/period"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ConfirmActionButton } from "@/components/ConfirmDialog"

export default async function PeriodsPage() {
  const result = await listPeriods()

  if (!result.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Périodes</h1>
        <div className="text-red-600">Erreur : {result.error}</div>
      </div>
    )
  }

  const periods = result.data

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Périodes</h1>
        <Link href="/admin/academics/periods/new">
          <Button>Nouvelle période</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Année scolaire
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ordre
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {periods.map((period) => (
              <tr key={period.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{period.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{period.schoolYear}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{period.order}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <form action={deletePeriod as any}>
                    <input type="hidden" name="id" value={period.id} />
                    <ConfirmActionButton
                      message={`Êtes-vous sûr de vouloir supprimer ${period.name} ? Cette action est irréversible.`}
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
            {periods.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucune période trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
