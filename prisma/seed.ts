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

  // Create additional mock teachers for testing
  const teacherPasswords = ["teacher123", "teacher123", "teacher123"]
  const teacherNames = [
    { firstName: "Marie", lastName: "Martin" },
    { firstName: "Pierre", lastName: "Dubois" },
    { firstName: "Sophie", lastName: "Bernard" },
  ]

  const mockTeachers = await Promise.all(
    teacherNames.map(async (name, index) => {
      const passwordHash = await bcrypt.hash(teacherPasswords[index], 10)
      const email = `teacher${index + 2}@sekoly-test.mg`
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash,
          role: "TEACHER",
          schoolId: school.id,
        },
      })

      const teacher = await prisma.teacher.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          firstName: name.firstName,
          lastName: name.lastName,
          schoolId: school.id,
        },
      })

      return teacher
    })
  )

  // Create additional mock students for testing
  const studentPasswords = ["student123", "student123", "student123", "student123", "student123"]
  const studentNames = [
    { firstName: "Lucas", lastName: "Rakoto" },
    { firstName: "Emma", lastName: "Rasoa" },
    { firstName: "Thomas", lastName: "Andriamanitra" },
    { firstName: "Chloé", lastName: "Ravelonarivo" },
    { firstName: "Hugo", lastName: "Randrianasolo" },
  ]

  const mockStudents = await Promise.all(
    studentNames.map(async (name, index) => {
      const passwordHash = await bcrypt.hash(studentPasswords[index], 10)
      const email = `student${index + 2}@sekoly-test.mg`
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash,
          role: "STUDENT",
          schoolId: school.id,
        },
      })

      const student = await prisma.student.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          firstName: name.firstName,
          lastName: name.lastName,
          schoolId: school.id,
          classroomId: sixieme1.id,
        },
      })

      await prisma.enrollment.upsert({
        where: { studentId_schoolYear: { studentId: student.id, schoolYear: "2025-2026" } },
        update: {},
        create: {
          studentId: student.id,
          classroomId: sixieme1.id,
          schoolYear: "2025-2026",
          schoolId: school.id,
        },
      })

      return student
    })
  )

  // Create a struggling student with grades < 10 for all assessments
  const strugglingStudentPassword = "student123"
  const strugglingStudentPasswordHash = await bcrypt.hash(strugglingStudentPassword, 10)
  const strugglingStudentEmail = "student-struggling@sekoly-test.mg"
  
  const strugglingUser = await prisma.user.upsert({
    where: { email: strugglingStudentEmail },
    update: {},
    create: {
      email: strugglingStudentEmail,
      passwordHash: strugglingStudentPasswordHash,
      role: "STUDENT",
      schoolId: school.id,
    },
  })

  const strugglingStudent = await prisma.student.upsert({
    where: { userId: strugglingUser.id },
    update: {},
    create: {
      userId: strugglingUser.id,
      firstName: "Marc",
      lastName: "Difficile",
      schoolId: school.id,
      classroomId: sixieme1.id,
    },
  })

  await prisma.enrollment.upsert({
    where: { studentId_schoolYear: { studentId: strugglingStudent.id, schoolYear: "2025-2026" } },
    update: {},
    create: {
      studentId: strugglingStudent.id,
      classroomId: sixieme1.id,
      schoolYear: "2025-2026",
      schoolId: school.id,
    },
  })

  // Get all subjects
  const subjects = await prisma.subject.findMany({ where: { schoolId: school.id } })
  const periods = await prisma.period.findMany({ where: { schoolId: school.id } })

  // Assign teachers to subjects in the classroom
  const originalTeacher = await prisma.user.findUnique({ where: { email: "prof@sekoly-test.mg" }, include: { teacher: true } })
  const allTeachers = [originalTeacher?.teacher, ...mockTeachers].filter((t): t is NonNullable<typeof t> => t !== undefined)

  // Assign each teacher to different subjects
  for (let i = 0; i < allTeachers.length && i < subjects.length; i++) {
    await prisma.teacherSubject.upsert({
      where: {
        teacherId_subjectId_classroomId: {
          teacherId: allTeachers[i].id,
          subjectId: subjects[i].id,
          classroomId: sixieme1.id,
        },
      },
      update: {},
      create: {
        teacherId: allTeachers[i].id,
        subjectId: subjects[i].id,
        classroomId: sixieme1.id,
        schoolId: school.id,
      },
    })
  }

  // Create grades for all students, subjects, and periods
  const allStudents = await prisma.student.findMany({ 
    where: { classroomId: sixieme1.id },
    include: { user: true }
  })

  for (const student of allStudents) {
    const isStrugglingStudent = student.user.email === "student-struggling@sekoly-test.mg"
    
    for (const subject of subjects) {
      for (const period of periods) {
        // Find the teacher assigned to this subject in this classroom
        const teacherSubject = await prisma.teacherSubject.findFirst({
          where: {
            subjectId: subject.id,
            classroomId: sixieme1.id,
          },
        })

        if (!teacherSubject) continue

        // Create 2-3 daily grades per period
        for (let i = 0; i < 3; i++) {
          const dailyGrade = isStrugglingStudent 
            ? 4 + Math.floor(Math.random() * 5) // 4-9 for struggling student
            : 10 + Math.floor(Math.random() * 10) // 10-20 for regular students
          
          const gradeDate = new Date()
          if (period.name === "Trimestre 2") {
            gradeDate.setMonth(gradeDate.getMonth() + 3)
          } else if (period.name === "Trimestre 3") {
            gradeDate.setMonth(gradeDate.getMonth() + 6)
          }
          gradeDate.setDate(gradeDate.getDate() + i * 7) // Different dates for each grade

          await prisma.grade.upsert({
            where: { id: `daily-${student.id}-${subject.id}-${period.id}-${i}` },
            update: {},
            create: {
              id: `daily-${student.id}-${subject.id}-${period.id}-${i}`,
              value: dailyGrade,
              type: "DAILY",
              date: gradeDate,
              studentId: student.id,
              subjectId: subject.id,
              classroomId: sixieme1.id,
              teacherId: teacherSubject.teacherId,
              periodId: period.id,
              schoolId: school.id,
            },
          })
        }

        // Create 1 exam grade per period
        const examGrade = isStrugglingStudent
          ? 3 + Math.floor(Math.random() * 6) // 3-9 for struggling student
          : 8 + Math.floor(Math.random() * 12) // 8-20 for regular students
        
        const examDate = new Date()
        if (period.name === "Trimestre 2") {
          examDate.setMonth(examDate.getMonth() + 3)
        } else if (period.name === "Trimestre 3") {
          examDate.setMonth(examDate.getMonth() + 6)
        }
        examDate.setDate(examDate.getDate() + 21) // Exam at end of period

        await prisma.grade.upsert({
          where: { id: `exam-${student.id}-${subject.id}-${period.id}` },
          update: {},
          create: {
            id: `exam-${student.id}-${subject.id}-${period.id}`,
            value: examGrade,
            type: "EXAM",
            date: examDate,
            studentId: student.id,
            subjectId: subject.id,
            classroomId: sixieme1.id,
            teacherId: teacherSubject.teacherId,
            periodId: period.id,
            schoolId: school.id,
          },
        })
      }
    }
  }

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
  console.log("  Classe de test : 6ème 1 avec", allStudents.length, "élèves")
  console.log("  Enseignants mock : 3 enseignants supplémentaires")
  console.log("  Notes créées : pour tous les élèves, matières et trimestres")
  console.log("  Élève en difficulté : Marc Difficile (notes < 10)")
  devSeedAccounts.forEach((account) => {
    console.log(`  ${account.label} : ${account.email} / ${account.password}`)
  })
  console.log("  Comptes mock supplémentaires :")
  mockTeachers.forEach((teacher, i) => {
    console.log(`    Enseignant ${i + 2} : teacher${i + 2}@sekoly-test.mg / ${teacherPasswords[i]}`)
  })
  mockStudents.forEach((student, i) => {
    console.log(`    Élève ${i + 2} : student${i + 2}@sekoly-test.mg / ${studentPasswords[i]}`)
  })
  console.log(`    Élève en difficulté : ${strugglingStudentEmail} / ${strugglingStudentPassword}`)
}


main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())