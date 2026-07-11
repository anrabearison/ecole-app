import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  switch (session.user.role) {
    case "PLATFORM_SUPER_ADMIN":
      redirect("/platform")
    case "SCHOOL_ADMIN":
    case "STAFF_ADMIN":
      redirect("/admin")
    case "TEACHER":
      redirect("/teacher")
    case "STUDENT":
      redirect("/student")
    default:
      redirect("/login")
  }
}
