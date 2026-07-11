import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

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

  return <div className="min-h-screen bg-gray-50">{children}</div>
}
