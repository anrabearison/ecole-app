import { getProfile } from "@/lib/actions/profile"
import { ProfileForm } from "@/components/ProfileForm"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const result = await getProfile()

  if (!result.success) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Gérez vos informations personnelles et votre mot de passe
        </p>
      </div>

      <ProfileForm profile={result.data} />
    </div>
  )
}
