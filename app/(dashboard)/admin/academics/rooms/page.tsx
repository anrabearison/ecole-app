import Link from "next/link"
import { listRooms, deleteRoom } from "@/lib/actions/room"
import { Button } from "@/components/ui/button"
import { ConfirmActionButton } from "@/components/ConfirmDialog"
import { PaginationClient } from "@/components/PaginationClient"
import { Plus } from "lucide-react"

export default async function RoomsPage({ searchParams }: { searchParams?: { page?: string } }) {
  const params = await searchParams
  const page = parseInt(params?.page || '1', 10) || 1
  const result = await listRooms({ page, pageSize: 20 })

  if (!result.success) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Salles</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {result.error}
        </div>
      </div>
    )
  }

  const rooms = result.data
  const pagination = result.pagination

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Salles</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Gestion des salles de cours de l'établissement</p>
        </div>
        <Link href="/admin/academics/rooms/new" className="self-start sm:self-auto">
          <Button className="gap-2 shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Nouvelle salle</span>
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        {rooms.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Aucune salle configurée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                    Nom de la salle
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider sm:px-6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {room.name}
                    </td>
                    <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-right text-sm font-medium">
                      <form action={async () => {
                        "use server"
                        await deleteRoom(room.id)
                      }}>
                        <ConfirmActionButton
                          message={`Êtes-vous sûr de vouloir supprimer ${room.name} ? Cette action est irréversible.`}
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
        )}
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
