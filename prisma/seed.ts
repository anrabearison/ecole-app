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
  const [primaryGrade, middleSchoolGrade, secondeGrade, premiereGrade] = await Promise.all([
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
    ["Mathématiques", "Français", "Sciences de la Vie et de la Terre", "Histoire-Géographie", "EPS", "Philosophie"].map(
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

  // Seed coefficient 0 for Philosophie in Seconde
  const philoSubject = await prisma.subject.findFirst({ where: { schoolId: school.id, name: "Philosophie" } })
  if (secondeGrade && philoSubject) {
    const existingCoeff = await prisma.subjectCoefficient.findFirst({
      where: { schoolId: school.id, subjectId: philoSubject.id, schoolGradeId: secondeGrade.id, trackId: null }
    })
    if (!existingCoeff) {
      await prisma.subjectCoefficient.create({
        data: {
          schoolId: school.id,
          subjectId: philoSubject.id,
          schoolGradeId: secondeGrade.id,
          trackId: null,
          coefficient: 0,
        }
      })
    }
  }

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

  // Classrooms with passingThreshold
  let cpA = await prisma.classroom.findFirst({ where: { section: "A", schoolYear: "2025-2026", schoolGradeId: primaryGrade.id } })
  if (!cpA) {
    cpA = await prisma.classroom.create({ data: { section: "A", schoolYear: "2025-2026", schoolGradeId: primaryGrade.id, schoolId: school.id, passingThreshold: 10 } })
  }

  let sixieme1 = await prisma.classroom.findFirst({ where: { section: "1", schoolYear: "2025-2026", schoolGradeId: middleSchoolGrade.id } })
  if (!sixieme1) {
    sixieme1 = await prisma.classroom.create({ data: { section: "1", schoolYear: "2025-2026", schoolGradeId: middleSchoolGrade.id, schoolId: school.id, passingThreshold: 10 } })
  }

  let seconde1 = await prisma.classroom.findFirst({ where: { section: "1", schoolYear: "2025-2026", schoolGradeId: premiereGrade.id } })
  if (!seconde1) {
    seconde1 = await prisma.classroom.create({ data: { section: "1", schoolYear: "2025-2026", schoolGradeId: premiereGrade.id, schoolId: school.id, passingThreshold: 10 } })
  }

  // Seed admin and platform admin users from shared dev account list
  const { devSeedAccounts } = await import("../lib/dev-seed-accounts")

  let mainTeacherId: string | null = null

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
        const teacher = await prisma.teacher.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            firstName: "Jean",
            lastName: "Professeur",
            nationalIdNumber: "123456789012",
            sex: "MALE",
            contractType: "FONCTIONNAIRE",
            schoolId: school.id,
          }
        })
        mainTeacherId = teacher.id
      }

      if (account.role === "STUDENT") {
        const student = await prisma.student.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            firstName: "Paul",
            lastName: "Eleve",
            registrationNumber: "2025-001",
            status: "PASSING",
            sex: "MALE",
            placeOfBirth: "Antananarivo",
            dateOfBirth: new Date("2010-03-15"),
            guardianName: "Parent Eleve",
            guardianPhone: "+261340000001",
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
    { firstName: "Marie", lastName: "Martin", contractType: "FONCTIONNAIRE" as const, cin: "3012345678901" },
    { firstName: "Pierre", lastName: "Dubois", contractType: "ENF" as const, cin: "3012345678902" },
    { firstName: "Sophie", lastName: "Bernard", contractType: "FONCTIONNAIRE" as const, cin: "3012345678903" },
  ]

  const mockTeachers = await Promise.all(
    teacherNames.map(async (name, index) => {
      const passwordHash = await bcrypt.hash(teacherPasswords[index], 10)
      // Second teacher (index 1) will have no email to test CIN-only login
      const email = index === 1 ? null : `teacher${index + 2}@sekoly-test.mg`

      // First, check if teacher already exists by nationalIdNumber
      const existingTeacher = await prisma.teacher.findFirst({
        where: { nationalIdNumber: name.cin },
        include: { user: true }
      })

      let user
      if (existingTeacher) {
        // Update existing teacher's password
        user = await prisma.user.update({
          where: { id: existingTeacher.userId },
          data: { passwordHash }
        })
      } else if (email) {
        // Create new user with email
        user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            passwordHash,
            role: "TEACHER",
            schoolId: school.id,
          },
        })
      } else {
        // Create new user without email
        user = await prisma.user.create({
          data: {
            email: null,
            passwordHash,
            role: "TEACHER",
            schoolId: school.id,
          },
        })
      }

      const teacher = await prisma.teacher.upsert({
        where: { userId: user.id },
        update: {
          firstName: name.firstName,
          lastName: name.lastName,
          nationalIdNumber: name.cin,
          sex: index % 2 === 0 ? "FEMALE" : "MALE",
          contractType: name.contractType,
        },
        create: {
          userId: user.id,
          firstName: name.firstName,
          lastName: name.lastName,
          nationalIdNumber: name.cin,
          sex: index % 2 === 0 ? "FEMALE" : "MALE",
          contractType: name.contractType,
          schoolId: school.id,
        },
      })

      return teacher
    })
  )

  // Create additional mock students for testing
  const studentPasswords = ["student123", "student123", "student123", "student123", "student123"]
  const studentNames = [
    { firstName: "Lucas", lastName: "Rakoto", status: "PASSING" as const, placeOfBirth: "Antananarivo" },
    { firstName: "Emma", lastName: "Rasoa", status: "REPEATING" as const, placeOfBirth: "Toamasina" },
    { firstName: "Thomas", lastName: "Andriamanitra", status: "PASSING" as const, placeOfBirth: "Fianarantsoa" },
    { firstName: "Chloé", lastName: "Ravelonarivo", status: "PASSING" as const, placeOfBirth: "Antsirabe" },
    { firstName: "Hugo", lastName: "Randrianasolo", status: "PASSING" as const, placeOfBirth: "Mahajanga" },
  ]

  const mockStudents = await Promise.all(
    studentNames.map(async (name, index) => {
      const passwordHash = await bcrypt.hash(studentPasswords[index], 10)
      const registrationNumber = `2025-00${index + 2}`
      // Third student (index 2) will have no email to test matricule-only login
      const email = index === 2 ? null : `student${index + 2}@sekoly-test.mg`

      // First, check if student already exists by registrationNumber
      const existingStudent = await prisma.student.findFirst({
        where: { registrationNumber },
        include: { user: true }
      })

      let user
      if (existingStudent) {
        // Update existing student's password
        user = await prisma.user.update({
          where: { id: existingStudent.userId },
          data: { passwordHash }
        })
      } else if (email) {
        // Create new user with email
        user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            passwordHash,
            role: "STUDENT",
            schoolId: school.id,
          },
        })
      } else {
        // Create new user without email
        user = await prisma.user.create({
          data: {
            email: null,
            passwordHash,
            role: "STUDENT",
            schoolId: school.id,
          },
        })
      }

      const student = await prisma.student.upsert({
        where: { userId: user.id },
        update: {
          firstName: name.firstName,
          lastName: name.lastName,
          registrationNumber,
          status: name.status,
          sex: index % 2 === 0 ? "FEMALE" : "MALE",
          placeOfBirth: name.placeOfBirth,
          dateOfBirth: new Date("2010-01-01"),
          guardianName: `Parent ${name.lastName}`,
          guardianPhone: "+26134000000" + index,
        },
        create: {
          userId: user.id,
          firstName: name.firstName,
          lastName: name.lastName,
          registrationNumber,
          status: name.status,
          sex: index % 2 === 0 ? "FEMALE" : "MALE",
          placeOfBirth: name.placeOfBirth,
          dateOfBirth: new Date("2010-01-01"),
          guardianName: `Parent ${name.lastName}`,
          guardianPhone: "+26134000000" + index,
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
  const strugglingRegistrationNumber = "2025-007"

  // Check if struggling student already exists
  const existingStrugglingStudent = await prisma.student.findFirst({
    where: { registrationNumber: strugglingRegistrationNumber },
    include: { user: true }
  })

  let strugglingUser
  if (existingStrugglingStudent) {
    // Update existing student's password
    strugglingUser = await prisma.user.update({
      where: { id: existingStrugglingStudent.userId },
      data: { passwordHash: strugglingStudentPasswordHash }
    })
  } else {
    // Create new user
    strugglingUser = await prisma.user.upsert({
      where: { email: strugglingStudentEmail },
      update: {},
      create: {
        email: strugglingStudentEmail,
        passwordHash: strugglingStudentPasswordHash,
        role: "STUDENT",
        schoolId: school.id,
      },
    })
  }

  let strugglingStudent = await prisma.student.upsert({
    where: { userId: strugglingUser.id },
    update: {
      firstName: "Marc",
      lastName: "Difficile",
      registrationNumber: strugglingRegistrationNumber,
      status: "REPEATING",
      sex: "MALE",
      placeOfBirth: "Antananarivo",
      dateOfBirth: new Date("2010-06-15"),
      guardianName: "Parent Difficile",
      guardianPhone: "+261340000009",
    },
    create: {
      userId: strugglingUser.id,
      firstName: "Marc",
      lastName: "Difficile",
      registrationNumber: strugglingRegistrationNumber,
      status: "REPEATING",
      sex: "MALE",
      placeOfBirth: "Antananarivo",
      dateOfBirth: new Date("2010-06-15"),
      guardianName: "Parent Difficile",
      guardianPhone: "+261340000009",
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

  // Set homeroom teacher on sixieme1 classroom
  if (mainTeacherId) {
    await prisma.classroomHomeroomTeacher.create({
      data: {
        classroomId: sixieme1.id,
        teacherId: mainTeacherId,
        schoolId: school.id,
        isPrimary: true
      }
    })
  }

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
  const epsSubject = await prisma.subject.findFirst({ where: { name: "EPS", schoolId: school.id } })
  const gymRoom = await prisma.room.findFirst({ where: { schoolId: school.id, name: "Gymnase" } })

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

  // Create schedule slots
  // Slot 1: Mathématiques in Salle 1
  if (teacherUser?.teacher && mathSubject) {
    await prisma.scheduleSlot.upsert({
      where: { id: "slot-math-6eme1" },
      update: {},
      create: {
        id: "slot-math-6eme1",
        day: "MONDAY",
        startTime: "08:00",
        endTime: "10:00",
        classroomId: sixieme1.id,
        subjectId: mathSubject.id,
        teacherId: teacherUser.teacher.id,
        roomId: (await prisma.room.findFirst({ where: { schoolId: school.id, name: "Salle 1" } }))?.id,
        schoolId: school.id,
      }
    })
  }

  // Slot 2: EPS in Gymnase (without room - uses Gymnase location)
  if (teacherUser?.teacher && epsSubject) {
    await prisma.scheduleSlot.upsert({
      where: { id: "slot-eps-6eme1" },
      update: {},
      create: {
        id: "slot-eps-6eme1",
        day: "WEDNESDAY",
        startTime: "14:00",
        endTime: "16:00",
        classroomId: sixieme1.id,
        subjectId: epsSubject.id,
        teacherId: teacherUser.teacher.id,
        roomId: gymRoom?.id,
        schoolId: school.id,
      }
    })
  }

  console.log("✓ Seed terminé — school:", school.id)
  console.log("  Niveaux :", primaryGrade.name, middleSchoolGrade.name, "Seconde", premiereGrade.name)
  console.log("  Séries Première : A, C, D")
  console.log("  Classes : CP A, 6ème 1 (avec prof. principal), Seconde 1")
  console.log("  Matières : Mathématiques, Français, SVT, Histoire-Géographie, EPS")
  console.log("  Salles : Salle 1, Salle 2, Labo Sciences, Gymnase")
  console.log("  Périodes : Trimestre 1, Trimestre 2, Trimestre 3 (2025-2026)")
  console.log("  Créneaux emploi du temps : 2 créneaux créés (Maths, EPS)")
  console.log("")
  console.log("=== COMPTES DE TEST ===")
  console.log("")
  console.log("Administrateurs (connexion par email) :")
  devSeedAccounts.forEach((account) => {
    if (account.role === "PLATFORM_SUPER_ADMIN" || account.role === "SCHOOL_ADMIN" || account.role === "STAFF_ADMIN") {
      console.log(`  ${account.label} :`)
      console.log(`    Identifiant : ${account.email}`)
      console.log(`    Mot de passe : ${account.password}`)
    }
  })
  console.log("")
  console.log("Enseignants (connexion par email ou CIN) :")
  console.log("  Professeur principal (Jean Professeur) :")
  console.log(`    Email : prof@sekoly-test.mg`)
  console.log(`    CIN : 123456789012`)
  console.log(`    Mot de passe : motdepasse123`)
  console.log(`    Type contrat : FONCTIONNAIRE`)
  mockTeachers.forEach((teacher, i) => {
    const hasEmail = i !== 1
    console.log(`  Enseignant ${i + 2} (${teacherNames[i].firstName} ${teacherNames[i].lastName}) :`)
    if (hasEmail) {
      console.log(`    Email : teacher${i + 2}@sekoly-test.mg`)
    }
    console.log(`    CIN : ${teacherNames[i].cin}`)
    console.log(`    Mot de passe : ${teacherPasswords[i]}`)
    console.log(`    Type contrat : ${teacherNames[i].contractType}`)
  })
  console.log("")
  console.log("Élèves (connexion par email ou matricule) :")
  console.log("  Élève principal (Paul Eleve) :")
  console.log(`    Email : eleve@sekoly-test.mg`)
  console.log(`    Matricule : 2025-001`)
  console.log(`    Mot de passe : motdepasse123`)
  console.log(`    Statut : PASSING`)
  mockStudents.forEach((student, i) => {
    const hasEmail = i !== 2
    const registrationNumber = `2025-00${i + 2}`
    console.log(`  Élève ${i + 2} (${studentNames[i].firstName} ${studentNames[i].lastName}) :`)
    if (hasEmail) {
      console.log(`    Email : student${i + 2}@sekoly-test.mg`)
    }
    console.log(`    Matricule : ${registrationNumber}`)
    console.log(`    Mot de passe : ${studentPasswords[i]}`)
    console.log(`    Statut : ${studentNames[i].status}`)
    console.log(`    Lieu de naissance : ${studentNames[i].placeOfBirth}`)
  })
  console.log("")
  console.log("  Élève en difficulté (Marc Difficile) :")
  console.log(`    Email : ${strugglingStudentEmail}`)
  console.log(`    Matricule : ${strugglingRegistrationNumber}`)
  console.log(`    Mot de passe : ${strugglingStudentPassword}`)
  console.log(`    Statut : REPEATING`)
  console.log("")
  console.log("=== RÉSUMÉ ===")
  console.log(`  ${allStudents.length} élèves créés avec notes pour toutes les matières et périodes`)
  console.log(`  ${allTeachers.length + 1} enseignants créés avec assignations de matières`)
  console.log(`  2 créneaux d'emploi du temps créés`)
  console.log("")
  console.log("Cas de test d'authentification :")
  console.log("  1. Email admin : admin@sekoly-test.mg")
  console.log("  2. Email enseignant : prof@sekoly-test.mg")
  console.log("  3. CIN enseignant (sans email) : 3012345678902")
  console.log("  4. Email élève : eleve@sekoly-test.mg")
  console.log("  5. Matricule élève (sans email) : 2025-004")
}


main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())