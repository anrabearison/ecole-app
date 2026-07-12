import Link from "next/link"
import { listRooms, deleteRoom } from "@/lib/actions/room"
import { Button } from "@/components/ui/button"

export default async function RoomsPage() {
  const result = await listRooms()

  if (!result.success) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {result.error}
        </div>
      </div>
    )
  }

  const rooms = result.data

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salles</h1>
          <p className="text-gray-600 mt-2">Gestion des salles de l'établissement</p>
        </div>
        <Link href="/admin/academics/rooms/new">
          <Button>Nouvelle salle</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {rooms.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucune salle configurée.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{room.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <form action={async () => {
                      "use server"
                      await deleteRoom(room.id)
                    }}>
                      <Button
                        variant="destructive"
                        size="sm"
                        type="submit"
                        onClick={(e) => {
                          if (!confirm(`Êtes-vous sûr de vouloir supprimer ${room.name} ? Cette action est irréversible.`)) {
                            e.preventDefault()
                          }
                        }}
                      >
                        Supprimer
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
