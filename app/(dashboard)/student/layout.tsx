import { auth } from "@/lib/auth"
import { getSchoolName } from "@/lib/getSchoolName"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "STUDENT") {
    redirect("/unauthorized")
  }

  const schoolNameResult: Awaited<ReturnType<typeof getSchoolName>> = session.user.schoolId
    ? await getSchoolName()
    : { success: false, error: "No school associated with user" }
  const schoolName = schoolNameResult.success ? schoolNameResult.data.name : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:flex">
        <Sidebar schoolName={schoolName} />
        <main className="flex-1 p-6 lg:min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
