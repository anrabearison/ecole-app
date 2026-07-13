import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"

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
      <div className="lg:flex">
        <Sidebar />
        <main className="flex-1 p-6 pt-16 lg:min-h-screen lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}
