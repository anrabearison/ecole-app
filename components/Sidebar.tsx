"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronRight, LogOut, Menu, X } from "lucide-react"
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

  return href !== "/" && pathname.startsWith(href + "/")
}

type SidebarProps = {
  schoolName?: string
}

export function Sidebar({ schoolName }: SidebarProps) {
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
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const nextState: Record<string, boolean> = {}

    items.forEach((item) => {
      if (item.type === "group") {
        nextState[item.label] = item.items.some((child) => isLinkActive(child.href, pathname))
      }
    })

    setOpenGroups((prev) => {
      const shouldUpdate = Object.keys(nextState).some((key) => nextState[key] !== prev[key])

      if (!shouldUpdate) {
        return prev
      }

      return { ...prev, ...nextState }
    })
  }, [items, pathname])

  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const closeSidebar = () => {
    setIsMobileOpen(false)
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  if (!session?.user) {
    return null
  }

  const roleLabel = role ? roleLabels[role] ?? role : session.user.role

  return (
    <>
      <button
        type="button"
        onClick={() => setIsMobileOpen((prev) => !prev)}
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm lg:hidden"
        aria-label="Open navigation"
      >
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/30 transition-opacity lg:hidden",
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeSidebar}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen w-[86vw] max-w-[280px] shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-5 shadow-xl transition-transform duration-300 lg:sticky lg:top-0 lg:w-[240px] lg:translate-x-0 lg:shadow-sm xl:w-[260px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="mb-4 flex items-center justify-between px-2 lg:hidden">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900">Navigation</div>
            {schoolName ? (
              <p className="mt-1 truncate text-xs font-medium text-slate-800">École {schoolName}</p>
            ) : null}
            <p className="mt-1 text-xs text-gray-500">Espace {roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
          <div className="px-2 lg:px-2">
            <div className="hidden text-sm font-semibold text-gray-900 lg:block">Navigation</div>
            {schoolName ? (
              <p className="mt-1 hidden text-xs font-medium text-slate-800 lg:block">École {schoolName}</p>
            ) : null}
            <p className="mt-1 hidden text-xs text-gray-500 lg:block">Espace {roleLabel}</p>
          </div>

          <div className="space-y-1 pb-4">
            {items.map((item) => {
              if (item.type === "link") {
                const active = isLinkActive(item.href, pathname)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar}
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
                            onClick={closeSidebar}
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
    </>
  )
}
