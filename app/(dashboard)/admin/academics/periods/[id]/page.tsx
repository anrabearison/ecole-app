import { getPeriodById } from "@/lib/actions/period"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import { deletePeriod } from "@/lib/actions/period"
import { ConfirmActionButton } from "@/components/ConfirmDialog"

export default async function PeriodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const result = await getPeriodById(resolvedParams.id)

  if (!result.success) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/academics/periods">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {result.error}
        </div>
      </div>
    )
  }

  const period = result.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/academics/periods">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {period.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/academics/periods/${resolvedParams.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Modifier</span>
            </Button>
          </Link>
          <form action={deletePeriod as any}>
            <input type="hidden" name="id" value={resolvedParams.id} />
            <ConfirmActionButton
              message={`Êtes-vous sûr de vouloir supprimer ${period.name} ? Cette action est irréversible.`}
              confirmLabel="Supprimer"
              cancelLabel="Annuler"
              destructive
              size="sm"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Supprimer</span>
            </ConfirmActionButton>
          </form>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Nom
              </label>
              <p className="text-lg font-semibold text-gray-900">{period.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Année scolaire
              </label>
              <p className="text-lg font-semibold text-gray-900">{period.schoolYear}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Ordre
              </label>
              <p className="text-lg font-semibold text-gray-900">{period.order}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Poids examen
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {(period.examWeight * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Poids journalier
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {(period.dailyWeight * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
