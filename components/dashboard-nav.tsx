"use client"

import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function DashboardNav() {
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  if (!session?.user) {
    return null
  }

  const roleLabels: Record<string, string> = {
    PLATFORM_SUPER_ADMIN: "Super Admin",
    SCHOOL_ADMIN: "Admin",
    STAFF_ADMIN: "Staff",
    TEACHER: "Enseignant",
    STUDENT: "Élève",
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            <span className="font-medium">{session.user.email}</span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-gray-500">{roleLabels[session.user.role] || session.user.role}</span>
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
        >
          Déconnexion
        </Button>
      </div>
    </nav>
  )
}
