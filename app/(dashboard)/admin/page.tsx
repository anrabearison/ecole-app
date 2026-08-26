import { auth } from "@/lib/auth"

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Tableau de bord Admin
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Bienvenue dans l'espace d'administration
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6">
        <p className="text-base sm:text-lg font-medium text-gray-800">
          Connecté en tant que <span className="text-indigo-600">{session.user.email}</span> ({session.user.role})
        </p>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Identifiant établissement : {session.user.schoolId || "N/A"}
        </p>
      </div>
    </div>
  )
}
