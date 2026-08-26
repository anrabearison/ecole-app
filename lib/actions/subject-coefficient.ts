"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { SubjectCoefficientSchema, type SubjectCoefficientInput } from "@/lib/validations/subject-coefficient"
import type { ActionResult } from "@/lib/utils"
import { revalidatePath } from "next/cache"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SubjectCoefficientWithRelations = {
  id: string
  coefficient: number
  subjectId: string
  subject: { id: string; name: string; coefficient: number }
  schoolGradeId: string
  schoolGrade: { id: string; name: string; cycle: string }
  trackId: string | null
  track: { id: string; name: string } | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper to access prisma.subjectCoefficient safely (handles dev server cache)
// ─────────────────────────────────────────────────────────────────────────────

function getSubjectCoefficientDelegate() {
  const delegate = (prisma as any).subjectCoefficient
  if (!delegate) {
    console.warn("[Prisma] subjectCoefficient delegate not found on PrismaClient instance. Please restart dev server.")
  }
  return delegate
}

// ─────────────────────────────────────────────────────────────────────────────
// Core helper: resolve effective coefficient (fallback chain)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the effective coefficient for a (subject, schoolGrade, optional track) combination.
 *
 * Fallback chain:
 *   1. SubjectCoefficient(subjectId, schoolGradeId, trackId)   — track-specific
 *   2. SubjectCoefficient(subjectId, schoolGradeId, null)       — grade-level default (no track)
 *   3. Subject.coefficient                                       — global default
 */
export async function getEffectiveCoefficient(
  subjectId: string,
  schoolGradeId: string,
  trackId: string | null,
  schoolId: string
): Promise<number> {
  const delegate = getSubjectCoefficientDelegate()

  if (delegate) {
    // 1. Try exact match (with specific track)
    if (trackId) {
      const specific = await delegate.findFirst({
        where: { subjectId, schoolGradeId, trackId, schoolId },
        select: { coefficient: true },
      })
      if (specific) return specific.coefficient
    }

    // 2. Try grade-level default (trackId = null)
    const gradeDefault = await delegate.findFirst({
      where: { subjectId, schoolGradeId, trackId: null, schoolId },
      select: { coefficient: true },
    })
    if (gradeDefault) return gradeDefault.coefficient
  }

  // 3. Global fallback: Subject.coefficient
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { coefficient: true },
  })
  return subject?.coefficient ?? 1.0
}

// ─────────────────────────────────────────────────────────────────────────────
// List coefficients for a school grade (and optional track filter)
// ─────────────────────────────────────────────────────────────────────────────

export async function listCoefficientsForGrade(
  schoolGradeId: string,
  trackId?: string | null
): Promise<ActionResult<SubjectCoefficientWithRelations[]>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!session.user.schoolId) return { success: false, error: "School ID is required" }
  if (!can(session.user.role, "view", "subject")) return { success: false, error: "Forbidden" }

  const delegate = getSubjectCoefficientDelegate()
  if (!delegate) {
    return { success: true, data: [] }
  }

  try {
    const coefficients = await delegate.findMany({
      where: {
        schoolGradeId,
        schoolId: session.user.schoolId,
        ...(trackId !== undefined ? { trackId } : {}),
      },
      include: {
        subject: { select: { id: true, name: true, coefficient: true } },
        schoolGrade: { select: { id: true, name: true, cycle: true } },
        track: { select: { id: true, name: true } },
      },
      orderBy: [{ subject: { name: "asc" } }],
    })

    return { success: true, data: coefficients as SubjectCoefficientWithRelations[] }
  } catch (error) {
    console.error("Error listing coefficients:", error)
    return { success: false, error: "Erreur lors de la récupération des coefficients" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Upsert a coefficient entry
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertSubjectCoefficient(
  data: SubjectCoefficientInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!session.user.schoolId) return { success: false, error: "School ID is required" }
  if (!can(session.user.role, "update", "subject")) return { success: false, error: "Forbidden" }

  const parsed = SubjectCoefficientSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const { subjectId, schoolGradeId, trackId, coefficient } = parsed.data
  const schoolId = session.user.schoolId
  const delegate = getSubjectCoefficientDelegate()

  if (!delegate) {
    return { success: false, error: "Veuillez redémarrer le serveur de développement (Prisma Client mis à jour)." }
  }

  try {
    // Find existing entry matching (subjectId, schoolGradeId, trackId, schoolId)
    const existing = await delegate.findFirst({
      where: { subjectId, schoolGradeId, trackId: trackId ?? null, schoolId },
    })

    let result: { id: string }
    if (existing) {
      result = await delegate.update({
        where: { id: existing.id },
        data: { coefficient },
        select: { id: true },
      })
    } else {
      result = await delegate.create({
        data: { subjectId, schoolGradeId, trackId: trackId ?? null, coefficient, schoolId },
        select: { id: true },
      })
    }

    revalidatePath("/admin/academics/coefficients")
    return { success: true, data: result }
  } catch (error) {
    console.error("Error upserting coefficient:", error)
    return { success: false, error: "Erreur lors de la sauvegarde du coefficient" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete a coefficient entry (reverts to fallback)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteSubjectCoefficient(id: string): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!session.user.schoolId) return { success: false, error: "School ID is required" }
  if (!can(session.user.role, "update", "subject")) return { success: false, error: "Forbidden" }

  const delegate = getSubjectCoefficientDelegate()
  if (!delegate) {
    return { success: false, error: "Veuillez redémarrer le serveur de développement." }
  }

  try {
    await delegate.deleteMany({
      where: { id, schoolId: session.user.schoolId },
    })
    revalidatePath("/admin/academics/coefficients")
    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error deleting coefficient:", error)
    return { success: false, error: "Erreur lors de la suppression du coefficient" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the full coefficients matrix for the UI
// (all school grades → their tracks → subjects → coefficients)
// ─────────────────────────────────────────────────────────────────────────────

export async function getCoefficientsMatrix(): Promise<
  ActionResult<{
    grades: Array<{
      id: string
      name: string
      cycle: string
      order: number
      tracks: Array<{ id: string; name: string }>
    }>
    subjects: Array<{ id: string; name: string; defaultCoefficient: number }>
    coefficients: SubjectCoefficientWithRelations[]
  }>
> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!session.user.schoolId) return { success: false, error: "School ID is required" }
  if (!can(session.user.role, "view", "subject")) return { success: false, error: "Forbidden" }

  const schoolId = session.user.schoolId
  const delegate = getSubjectCoefficientDelegate()

  try {
    const [grades, subjects, coefficients] = await Promise.all([
      prisma.schoolGrade.findMany({
        where: { schoolId },
        include: { tracks: { orderBy: { name: "asc" } } },
        orderBy: { order: "asc" },
      }),
      prisma.subject.findMany({
        where: { schoolId },
        select: { id: true, name: true, coefficient: true },
        orderBy: { name: "asc" },
      }),
      delegate
        ? delegate.findMany({
            where: { schoolId },
            include: {
              subject: { select: { id: true, name: true, coefficient: true } },
              schoolGrade: { select: { id: true, name: true, cycle: true } },
              track: { select: { id: true, name: true } },
            },
          })
        : Promise.resolve([]),
    ])

    return {
      success: true,
      data: {
        grades: grades.map((g: { id: string; name: string; cycle: string; order: number; tracks: Array<{ id: string; name: string }> }) => ({
          id: g.id,
          name: g.name,
          cycle: g.cycle,
          order: g.order,
          tracks: g.tracks,
        })),
        subjects: subjects.map((s: { id: string; name: string; coefficient: number }) => ({
          id: s.id,
          name: s.name,
          defaultCoefficient: s.coefficient,
        })),
        coefficients: coefficients as SubjectCoefficientWithRelations[],
      },
    }
  } catch (error) {
    console.error("Error fetching coefficients matrix:", error)
    return { success: false, error: "Erreur lors de la récupération de la matrice des coefficients" }
  }
}
