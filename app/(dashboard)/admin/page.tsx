import { auth } from "@/lib/auth"

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Admin Dashboard
      </h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-lg text-gray-700">
          Bienvenue, {session.user.email} ({session.user.role})
        </p>
        <p className="text-sm text-gray-500 mt-2">
          School ID: {session.user.schoolId || "N/A"}
        </p>
      </div>
    </div>
  )
}
