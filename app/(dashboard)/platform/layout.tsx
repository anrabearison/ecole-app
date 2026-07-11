import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "PLATFORM_SUPER_ADMIN") {
    redirect("/unauthorized")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      {children}
    </div>
  )
}
