import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (!["SCHOOL_ADMIN", "STAFF_ADMIN", "PLATFORM_SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/unauthorized")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
