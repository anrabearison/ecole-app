import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/lib/utils"

export async function getSchoolName(): Promise<ActionResult<{ name: string }>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "No school associated with user" }
  }

  try {
    const school = await prisma.school.findUnique({
      where: { id: session.user.schoolId },
      select: { name: true },
    })

    if (!school) {
      return { success: false, error: "School not found" }
    }

    return { success: true, data: { name: school.name } }
  } catch (error: any) {
    console.error("Error fetching school name:", error)
    return { success: false, error: "Erreur lors de la récupération du nom de l'école" }
  }
}
