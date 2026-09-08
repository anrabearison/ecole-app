/**
 * Script de migration : Grade (flat) → Assessment + Grade (normalisé)
 *
 * Ce script est IDEMPOTENT : il peut être exécuté plusieurs fois sans créer de doublons.
 * Usage local  : DATABASE_URL=... npx tsx scripts/migrate-to-assessment.ts
 * Usage prod   : DATABASE_URL=<supabase_url> npx tsx scripts/migrate-to-assessment.ts
 *
 * Stratégie :
 *   1. Lire toutes les Grade dont assessmentId est encore NULL
 *   2. Grouper par (classroomId, subjectId, teacherId, periodId, type, date_jour)
 *   3. Pour chaque groupe : upsert un Assessment puis MAJ les Grade
 *   4. Vérification finale : aucune Grade ne doit avoir assessmentId = null
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

// Use DIRECT_URL (port 5432) to bypass PgBouncer — Prisma's prepared statements
// are incompatible with PgBouncer in transaction/session mode.
const _rawConnectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (!_rawConnectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL environment variable must be set")
}

const connectionString: string = _rawConnectionString

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter } as any)

function toDateKey(date: Date): string {
  // Normalize to YYYY-MM-DD (UTC) to group grades from the same day
  return date.toISOString().split("T")[0]
}

async function main() {
  console.log("🚀 Démarrage de la migration Grade → Assessment + Grade")
  console.log("   Connection :", connectionString.replace(/:\/\/[^@]+@/, "://<credentials>@"))
  console.log("")

  // 1. Count existing assessments to detect re-run
  // Use raw query because the Prisma client may not be regenerated yet with Assessment model
  const existingAssessmentRaw = await prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM "Assessment"`
  const existingAssessmentCount = Number(existingAssessmentRaw[0]?.count ?? 0)
  console.log(`ℹ️  Assessments existants en base : ${existingAssessmentCount}`)

  // 2. Fetch all Grade rows that still have no assessmentId (raw SQL — assessmentId is
  //    non-nullable in the Prisma schema, so the generated client rejects null filters)
  const grades = await prisma.$queryRaw<
    Array<{
      id: string
      value: number
      comment: string | null
      studentId: string
      classroomId: string
      subjectId: string
      teacherId: string
      periodId: string
      schoolId: string
      type: string
      date: Date
      createdAt: Date
      assessmentId: string | null
    }>
  >`SELECT * FROM "Grade" WHERE "assessmentId" IS NULL ORDER BY "createdAt" ASC`

  console.log(`📊 Notes sans Assessment à migrer : ${grades.length}`)

  if (grades.length === 0) {
    console.log("✅ Toutes les notes ont déjà un Assessment. Rien à faire.")
    return
  }

  // 3. Group grades by composite key
  type GroupKey = string
  const groups = new Map<GroupKey, typeof grades>()

  for (const grade of grades) {
    const g = grade as any
    const key: GroupKey = [
      g.classroomId,
      g.subjectId,
      g.teacherId,
      g.periodId,
      g.type,
      toDateKey(g.date),
    ].join("|")

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(grade)
  }

  console.log(`🗂️  Groupes (= futurs Assessments) à créer : ${groups.size}`)
  console.log("")

  let created = 0
  let reused = 0
  let gradesUpdated = 0

  for (const [, gradeGroup] of groups) {
    const first = gradeGroup[0] as any
    const dateDay = toDateKey(first.date)
    const dayStart = new Date(`${dateDay}T00:00:00.000Z`)
    const dayEnd = new Date(`${dateDay}T23:59:59.999Z`)

    // 4a. Check if an Assessment already exists for this group (idempotency)
    const existingRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Assessment"
      WHERE "classroomId" = ${first.classroomId}
        AND "subjectId"   = ${first.subjectId}
        AND "teacherId"   = ${first.teacherId}
        AND "periodId"    = ${first.periodId}
        AND type          = ${first.type}::"GradeType"
        AND date          >= ${dayStart}
        AND date          <= ${dayEnd}
      LIMIT 1
    `

    let assessmentId: string

    if (existingRows.length > 0) {
      assessmentId = existingRows[0].id
      reused++
    } else {
      // 4b. Create the Assessment via raw INSERT
      const newRows = await prisma.$queryRaw<Array<{ id: string }>>`
        INSERT INTO "Assessment" (id, date, type, "classroomId", "subjectId", "teacherId", "periodId", "schoolId", "createdAt")
        VALUES (
          gen_random_uuid()::text,
          ${dayStart},
          ${first.type}::"GradeType",
          ${first.classroomId},
          ${first.subjectId},
          ${first.teacherId},
          ${first.periodId},
          ${first.schoolId},
          NOW()
        )
        RETURNING id
      `
      assessmentId = newRows[0].id
      created++
    }

    // 4c. Update all Grade rows in this group
    const gradeIds = gradeGroup.map((g) => g.id)
    const { count } = await prisma.grade.updateMany({
      where: { id: { in: gradeIds } },
      data: { assessmentId } as any,
    })
    gradesUpdated += count
  }

  console.log(`✅ Assessments créés   : ${created}`)
  console.log(`♻️  Assessments réutilisés : ${reused}`)
  console.log(`📝 Notes mises à jour  : ${gradesUpdated}`)
  console.log("")

  // 5. Final verification (raw SQL for same reason as above)
  const remainingRows = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "Grade" WHERE "assessmentId" IS NULL
  `
  const remaining = Number(remainingRows[0]?.count ?? 0)

  if (remaining > 0) {
    console.error(`❌ ERREUR : ${remaining} note(s) n'ont toujours pas d'assessmentId après migration !`)
    process.exit(1)
  } else {
    console.log("🎉 Vérification réussie : toutes les notes ont un assessmentId.")
  }
}

main()
  .catch((err) => {
    console.error("❌ Erreur fatale :", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
