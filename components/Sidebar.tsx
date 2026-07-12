"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronRight, LogOut } from "lucide-react"
import { navByRole, type NavGroup } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const roleLabels: Record<string, string> = {
  PLATFORM_SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "Admin",
  STAFF_ADMIN: "Staff",
  TEACHER: "Enseignant",
  STUDENT: "Élève",
}

function isLinkActive(href: string, pathname: string) {
  if (href === pathname) {
    return true
  }

  // Only allow matching prefixed routes for nested pages, not root containers.
  return href !== "/" && pathname.startsWith(href + "/")
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role as keyof typeof navByRole | undefined
  const items = useMemo(() => (role ? navByRole[role] : []), [role])

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}

    items.forEach((item) => {
      if (item.type === "group") {
        initial[item.label] = item.items.some((child) => isLinkActive(child.href, pathname))
      }
    })

    return initial
  })

  useEffect(() => {
    const nextState: Record<string, boolean> = {}

    items.forEach((item) => {
      if (item.type === "group") {
        nextState[item.label] = item.items.some((child) => isLinkActive(child.href, pathname))
      }
    })

    setOpenGroups((prev) => {
      const shouldUpdate = Object.keys(nextState).some(
        (key) => nextState[key] !== prev[key]
      )

      if (!shouldUpdate) {
        return prev
      }

      return { ...prev, ...nextState }
    })
  }, [items, pathname])

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  if (!session?.user) {
    return null
  }

  const roleLabel = role ? roleLabels[role] ?? role : session.user.role

  return (
    <aside className="flex h-screen shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-5 shadow-sm lg:w-[240px] xl:w-[260px]">
      <div className="flex flex-col gap-4">
        <div className="px-2">
          <div className="text-sm font-semibold text-gray-900">Navigation</div>
          <p className="mt-1 text-xs text-gray-500">Espace {roleLabel}</p>
        </div>

        <div className="space-y-1 overflow-y-auto pb-4">
          {items.map((item) => {
            if (item.type === "link") {
              const active = isLinkActive(item.href, pathname)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-slate-100 text-slate-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            }

            const group = item as NavGroup
            const isOpen = openGroups[group.label] ?? false
            const groupActive = group.items.some((child) => isLinkActive(child.href, pathname))
            const GroupIcon = group.icon

            return (
              <div key={group.label} className="rounded-lg border border-transparent">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    groupActive ? "bg-slate-100 text-slate-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <GroupIcon className="h-4 w-4" />
                    {group.label}
                  </span>
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {isOpen && (
                  <div className="mt-2 space-y-1 pl-8">
                    {group.items.map((child) => {
                      const active = isLinkActive(child.href, pathname)
                      const ChildIcon = child.icon
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                            active ? "bg-slate-100 text-slate-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          )}
                        >
                          <ChildIcon className="h-3.5 w-3.5" />
                          <span>{child.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-auto rounded-2xl border border-gray-200 bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">Connecté en tant que</p>
        <p className="mt-2 text-sm font-semibold text-gray-900">{session.user.email}</p>
        <p className="text-sm text-gray-500">{roleLabel}</p>
        <Button className="mt-4 w-full" variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Déconnexion
        </Button>
      </div>
    </aside>
  )
}
