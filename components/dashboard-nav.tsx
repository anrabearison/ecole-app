"use client"

import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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

  const getNavLinks = () => {
    switch (session.user.role) {
      case "PLATFORM_SUPER_ADMIN":
        return [{ href: "/platform", label: "Écoles" }]
      case "SCHOOL_ADMIN":
      case "STAFF_ADMIN":
        return [
          { href: "/admin", label: "Tableau de bord" },
          { href: "/admin/schedule", label: "Emploi du temps" },
          { href: "/admin/academics", label: "Académique" },
          { href: "/admin/users", label: "Utilisateurs" },
          { href: "/admin/grades", label: "Notes" },
        ]
      case "TEACHER":
        return [
          { href: "/teacher", label: "Tableau de bord" },
          { href: "/teacher/schedule", label: "Emploi du temps" },
          { href: "/teacher/grades", label: "Notes" },
        ]
      case "STUDENT":
        return [
          { href: "/student", label: "Tableau de bord" },
          { href: "/student/schedule", label: "Emploi du temps" },
          { href: "/student/my-grades", label: "Mes notes" },
        ]
      default:
        return []
    }
  }

  const navLinks = getNavLinks()

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {navLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
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
