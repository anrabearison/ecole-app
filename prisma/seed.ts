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

  // Classrooms
  let cpA = await prisma.classroom.findFirst({ where: { section: "A", schoolYear: "2025-2026", schoolGradeId: primaryGrade.id } })
  if (!cpA) {
    cpA = await prisma.classroom.create({ data: { section: "A", schoolYear: "2025-2026", schoolGradeId: primaryGrade.id, schoolId: school.id } })
  }

  let sixieme1 = await prisma.classroom.findFirst({ where: { section: "1", schoolYear: "2025-2026", schoolGradeId: middleSchoolGrade.id } })
  if (!sixieme1) {
    sixieme1 = await prisma.classroom.create({ data: { section: "1", schoolYear: "2025-2026", schoolGradeId: middleSchoolGrade.id, schoolId: school.id } })
  }

  let seconde1 = await prisma.classroom.findFirst({ where: { section: "1", schoolYear: "2025-2026", schoolGradeId: premiereGrade.id } })
  if (!seconde1) {
    seconde1 = await prisma.classroom.create({ data: { section: "1", schoolYear: "2025-2026", schoolGradeId: premiereGrade.id, schoolId: school.id } })
  }

  // Seed admin and platform admin users from shared dev account list
  const { devSeedAccounts } = await import("../lib/dev-seed-accounts")

  await Promise.all(
    devSeedAccounts.map(async (account) => {
      const passwordHash = await bcrypt.hash(account.password, 10)
      const user = await prisma.user.upsert({
        where: { email: account.email },
        update: {},
        create: {
          email: account.email,
          passwordHash,
          role: account.role,
          schoolId: account.role === "PLATFORM_SUPER_ADMIN" ? null : school.id,
        },
      })

      if (account.role === "TEACHER") {
        await prisma.teacher.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            firstName: "Jean",
            lastName: "Professeur",
            schoolId: school.id,
          }
        })
      }

      if (account.role === "STUDENT") {
        const student = await prisma.student.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            firstName: "Paul",
            lastName: "Eleve",
            schoolId: school.id,
            classroomId: sixieme1.id,
          }
        })

        await prisma.enrollment.upsert({
          where: { studentId_schoolYear: { studentId: student.id, schoolYear: "2025-2026" } },
          update: {},
          create: {
            studentId: student.id,
            classroomId: sixieme1.id,
            schoolYear: "2025-2026",
            schoolId: school.id,
          }
        })
      }
    })
  )

  const teacherUser = await prisma.user.findUnique({ where: { email: "prof@sekoly-test.mg" }, include: { teacher: true } })
  const mathSubject = await prisma.subject.findFirst({ where: { name: "Mathématiques", schoolId: school.id } })

  if (teacherUser?.teacher && mathSubject) {
    await prisma.teacherSubject.upsert({
      where: { teacherId_subjectId_classroomId: { teacherId: teacherUser.teacher.id, subjectId: mathSubject.id, classroomId: sixieme1.id } },
      update: {},
      create: {
        teacherId: teacherUser.teacher.id,
        subjectId: mathSubject.id,
        classroomId: sixieme1.id,
        schoolId: school.id,
      }
    })
  }

  console.log("✓ Seed terminé — school:", school.id)
  console.log("  Niveaux :", primaryGrade.name, middleSchoolGrade.name, "Seconde", premiereGrade.name)
  console.log("  Séries Première : A, C, D")
  devSeedAccounts.forEach((account) => {
    console.log(`  ${account.label} : ${account.email} / ${account.password}`)
  })
}


main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())