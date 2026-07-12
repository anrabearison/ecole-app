// prisma/seed.ts
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  // School has no unique constraint on name — use findFirst + create to stay idempotent
  let school = await prisma.school.findFirst({ where: { name: "Sekoly Test" } })
  if (!school) {
    school = await prisma.school.create({
      data: { name: "Sekoly Test", address: "Amboavory" },
    })
  }

  // SchoolGrade unique: (name, cycle, schoolId)
  const [primaryGrade, middleSchoolGrade, , premiereGrade] = await Promise.all([
    prisma.schoolGrade.upsert({
      where: { name_cycle_schoolId: { name: "CP", cycle: "PRIMARY", schoolId: school.id } },
      update: {},
      create: { name: "CP", cycle: "PRIMARY", order: 1, schoolId: school.id },
    }),
    prisma.schoolGrade.upsert({
      where: { name_cycle_schoolId: { name: "6ème", cycle: "MIDDLE_SCHOOL", schoolId: school.id } },
      update: {},
      create: { name: "6ème", cycle: "MIDDLE_SCHOOL", order: 1, schoolId: school.id },
    }),
    prisma.schoolGrade.upsert({
      where: { name_cycle_schoolId: { name: "Seconde", cycle: "HIGH_SCHOOL", schoolId: school.id } },
      update: {},
      create: { name: "Seconde", cycle: "HIGH_SCHOOL", order: 1, schoolId: school.id },
    }),
    prisma.schoolGrade.upsert({
      where: { name_cycle_schoolId: { name: "Première", cycle: "HIGH_SCHOOL", schoolId: school.id } },
      update: {},
      create: { name: "Première", cycle: "HIGH_SCHOOL", order: 2, schoolId: school.id },
    }),
  ])

  // Tracks for Première — skip duplicates
  await Promise.all(["A", "C", "D"].map((name) =>
    prisma.track.upsert({
      where: { name_schoolGradeId: { name, schoolGradeId: premiereGrade.id } },
      update: {},
      create: { name, schoolGradeId: premiereGrade.id, schoolId: school.id },
    })
  ))

  // Basic Subjects — skip duplicates
  await Promise.all(
    ["Mathématiques", "Français", "Sciences de la Vie et de la Terre", "Histoire-Géographie", "EPS"].map(
      (name) =>
        prisma.subject.findFirst({ where: { schoolId: school.id, name } }).then(async (existing) => {
          if (!existing) {
            await prisma.subject.create({
              data: { name, schoolId: school.id },
            })
          }
        })
    )
  )

  // Rooms — skip duplicates
  await Promise.all(
    ["Salle 1", "Salle 2", "Labo Sciences", "Gymnase"].map(
      (name) =>
        prisma.room.findFirst({ where: { schoolId: school.id, name } }).then(async (existing: any) => {
          if (!existing) {
            await prisma.room.create({
              data: { name, schoolId: school.id },
            })
          }
        })
    )
  )

  // Periods — skip duplicates
  await Promise.all(
    ["Trimestre 1", "Trimestre 2", "Trimestre 3"].map((name, index) =>
      prisma.period.findFirst({ where: { schoolId: school.id, name, schoolYear: "2025-2026" } }).then(async (existing: any) => {
        if (!existing) {
          await prisma.period.create({
            data: { name, order: index + 1, schoolYear: "2025-2026", schoolId: school.id, examWeight: 0.6, dailyWeight: 0.4 },
          })
        }
      })
    )
  )

  // Admin user — upsert by email)
  const passwordHash = await bcrypt.hash("motdepasse123", 10)
  await prisma.user.upsert({
    where: { email: "admin@sekoly-test.mg" },
    update: {},
    create: {
      email: "admin@sekoly-test.mg",
      passwordHash,
      role: "SCHOOL_ADMIN",
      schoolId: school.id,
    },
  })

  // PLATFORM_SUPER_ADMIN user — upsert by email (no schoolId)
  const platformPasswordHash = await bcrypt.hash("platform123", 10)
  await prisma.user.upsert({
    where: { email: "platform@ecole-app.mg" },
    update: {},
    create: {
      email: "platform@ecole-app.mg",
      passwordHash: platformPasswordHash,
      role: "PLATFORM_SUPER_ADMIN",
      schoolId: null,
    },
  })

  console.log("✓ Seed terminé — school:", school.id)
  console.log("  Niveaux :", primaryGrade.name, middleSchoolGrade.name, "Seconde", premiereGrade.name)
  console.log("  Séries Première : A, C, D")
  console.log("  Admin : admin@sekoly-test.mg / motdepasse123")
  console.log("  Platform Super Admin : platform@ecole-app.mg / platform123")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())