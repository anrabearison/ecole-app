"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/lib/utils"
import { calculateSubjectAverage, calculateGeneralAverage, calculateClassRank, getStudentSubjectAverages, calculateSubjectRank } from "./average"
import { calculateAppreciation, calculateTotalNotes, calculateTotalCoefficients } from "@/lib/utils/calculations"
import { generateReportCardPdfBuffer, generateClassReportPdfBuffer, type ReportCardData } from "@/lib/pdf/generate-pdf-react"
import { getReportCardComment } from "./report-card-comment"
import { getSelectedDailyAssessmentIds } from "./daily-grade-selection"
import { getEffectiveCoefficient } from "@/lib/actions/subject-coefficient"

/**
 * Generate a PDF report card for a student in a period
 * SCHOOL_ADMIN/STAFF_ADMIN can generate for any student in their school
 * STUDENT can only generate their own report card
 */
export async function generateReportCardPdf(studentId: string, periodId: string): Promise<ActionResult<{ pdfBase64: string; fileName: string }>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "L'identifiant de l'école est manquant" }
  }

  // Check permissions
  const isStudent = session.user.role === "STUDENT"
  if (isStudent && session.user.studentId !== studentId) {
    return { success: false, error: "Forbidden" }
  }

  if (!can(session.user.role, "view", "student", { 
    studentId: isStudent ? (session.user.studentId || undefined) : undefined, 
    schoolId: session.user.schoolId 
  })) {
    return { success: false, error: "Forbidden" }
  }

  try {
    // Fetch student with classroom and school
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        classNumber: true,
        sex: true,
        classroomId: true,
        classroom: {
          include: {
            schoolGrade: true,
            track: true,
          },
        },
        school: true,
      },
    })

    if (!student) {
      return { success: false, error: "Élève non trouvé" }
    }

    // Fetch period
    const period = await prisma.period.findUnique({
      where: { id: periodId },
    })

    if (!period) {
      return { success: false, error: "Période non trouvée" }
    }

    // Fetch subject averages
    const subjectAveragesResult = await getStudentSubjectAverages(studentId, periodId)
    if (!subjectAveragesResult.success) {
      return { success: false, error: "Erreur lors du calcul des moyennes matière" }
    }

    // Calculate general average
    const generalAverageResult = await calculateGeneralAverage(studentId, periodId)
    if (!generalAverageResult.success) {
      return { success: false, error: "Erreur lors du calcul de la moyenne générale" }
    }

    // Calculate class rank
    if (!student.classroomId) {
      return { success: false, error: "L'élève n'est pas assigné à une classe" }
    }
    const classRankResult = await calculateClassRank(studentId, student.classroomId, periodId)
    if (!classRankResult.success) {
      return { success: false, error: "Erreur lors du calcul du classement" }
    }

    // Fetch appreciation comment
    const commentResult = await getReportCardComment(studentId, periodId)
    const appreciation = commentResult.success && commentResult.data ? commentResult.data.comment : undefined

    // Build class name
    let className = student.classroom?.schoolGrade?.name || ""
    if (student.classroom?.track) {
      className += ` ${student.classroom.track.name}`
    }
    if (student.classroom?.section) {
      className += ` ${student.classroom.section}`
    }

    // Build daily selection map for this student
    if (!student.classroomId) {
      return { success: false, error: "L'élève n'est pas assigné à une classe" }
    }

    const dailyAssessments = await prisma.assessment.findMany({
      where: { classroomId: student.classroomId, periodId, schoolId: session.user.schoolId, type: "DAILY" },
      select: { subjectId: true },
      distinct: ["subjectId"],
    })

    const dailySelectionMap = new Map<string, string[] | null>()
    for (const { subjectId } of dailyAssessments) {
      const selectedIds = await getSelectedDailyAssessmentIds(student.classroomId, subjectId, periodId, session.user.schoolId)
      dailySelectionMap.set(subjectId, selectedIds)
    }

    // Build subjects with detailed data
    const subjectsWithDetails = []
    for (const sa of subjectAveragesResult.data) {
      const selectedDailyIds = dailySelectionMap.get(sa.subjectId)
      const subjectAvgResult = await calculateSubjectAverage(studentId, sa.subjectId, periodId, selectedDailyIds)

      // Get individual daily and exam averages
      const grades = await prisma.grade.findMany({
        where: {
          studentId,
          assessment: {
            subjectId: sa.subjectId,
            periodId,
            schoolId: session.user.schoolId,
          },
        },
        include: {
          assessment: {
            select: { id: true, type: true },
          },
        },
      })

      let dailySum = 0
      let dailyCount = 0
      let examSum = 0
      let examCount = 0

      for (const grade of grades) {
        const isSelected =
          selectedDailyIds === undefined || selectedDailyIds === null
            ? true
            : selectedDailyIds.includes(grade.assessment.id)

        if (grade.assessment.type === "EXAM") {
          examSum += grade.value
          examCount++
        } else if (isSelected) {
          dailySum += grade.value
          dailyCount++
        }
      }

      const dailyAverage = dailyCount > 0 ? dailySum / dailyCount : 0
      const examAverage = examCount > 0 ? examSum / examCount : 0
      const weightedAverage = sa.average
      const finalNote = sa.coefficient * weightedAverage

      // Calculate subject rank
      const subjectRankResult = await calculateSubjectRank(studentId, sa.subjectId, student.classroomId, periodId, dailySelectionMap)

      subjectsWithDetails.push({
        name: sa.subjectName,
        coefficient: sa.coefficient,
        dailyAverage,
        examAverage,
        weightedAverage,
        finalNote,
        rank: subjectRankResult.success ? subjectRankResult.data.rank : 0,
        totalStudents: subjectRankResult.success ? subjectRankResult.data.totalStudents : 0,
      })
    }

    // Calculate total notes and coefficients
    const totalNotes = calculateTotalNotes(subjectAveragesResult.data)
    const totalCoefficients = calculateTotalCoefficients(subjectAveragesResult.data)

    // Calculate appreciation
    const calculatedAppreciation = calculateAppreciation(generalAverageResult.data)

    // Prepare report card data
    const reportCardData: ReportCardData = {
      schoolName: student.school.name,
      schoolAddress: student.school.address || undefined,
      schoolLogoUrl: (student.school as any).logoUrl || undefined,
      schoolYear: period.schoolYear,
      periodName: period.name,
      studentFirstName: student.firstName || "",
      studentLastName: student.lastName,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.toISOString().split("T")[0] : undefined,
      className,
      classNumber: student.classNumber?.toString() || undefined,
      sex: student.sex || undefined,
      subjects: subjectsWithDetails,
      totalNotes,
      totalCoefficients,
      generalAverage: generalAverageResult.data,
      classRank: classRankResult.data.rank,
      totalStudents: classRankResult.data.totalStudents,
      appreciation: calculatedAppreciation || undefined,
    }

    // Generate PDF
    const pdfStream = await generateReportCardPdfBuffer(reportCardData)
    const pdfBase64 = pdfStream.toString("base64")

    const fileName = `Bulletin_${student.lastName}_${student.firstName || ""}_${period.name.replace(/\s+/g, "_")}.pdf`

    return { success: true, data: { pdfBase64, fileName } }
  } catch (error: any) {
    console.error("Error generating report card PDF:", error)
    return { success: false, error: "Erreur lors de la génération du bulletin PDF" }
  }
}

/**
 * Generate a compiled PDF with all student report cards for a classroom and period.
 * Applies the daily grade selection configured by each teacher per subject.
 * Only SCHOOL_ADMIN and STAFF_ADMIN can generate class report cards.
 */
export async function generateClassReportCardsPdf(
  classroomId: string,
  periodId: string,
): Promise<ActionResult<{ pdfBase64: string; fileName: string }>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "L'identifiant de l'école est manquant" }
  }

  if (!can(session.user.role, "view", "student", { schoolId: session.user.schoolId })) {
    return { success: false, error: "Forbidden" }
  }

  try {
    const schoolId = session.user.schoolId

    // 1. Load classroom with school info
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        schoolGrade: true,
        track: true,
        school: true,
      },
    })

    if (!classroom || classroom.schoolId !== schoolId) {
      return { success: false, error: "Classe non trouvée" }
    }

    // 2. Load period
    const period = await prisma.period.findUnique({
      where: { id: periodId },
    })

    if (!period || period.schoolId !== schoolId) {
      return { success: false, error: "Période non trouvée" }
    }

    // 3. Load all students in the classroom
    const students = await prisma.student.findMany({
      where: { classroomId, schoolId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, classroom: { select: { schoolGradeId: true, trackId: true } } },
    })

    if (students.length === 0) {
      return { success: false, error: "Aucun élève dans cette classe" }
    }

    // 4. Build daily selection map: subjectId → selectedAssessmentIds
    //    Fetch all distinct subjects that have DAILY assessments in this classroom+period
    const dailyAssessments = await prisma.assessment.findMany({
      where: { classroomId, periodId, schoolId, type: "DAILY" },
      select: { subjectId: true },
      distinct: ["subjectId"],
    })

    const dailySelectionMap = new Map<string, string[] | null>()
    for (const { subjectId } of dailyAssessments) {
      const selectedIds = await getSelectedDailyAssessmentIds(classroomId, subjectId, periodId, schoolId)
      dailySelectionMap.set(subjectId, selectedIds)
    }

    // 5. Build class name
    let className = classroom.schoolGrade?.name || ""
    if (classroom.track) className += ` ${classroom.track.name}`
    if (classroom.section) className += ` ${classroom.section}`

    const schoolLogoUrl = (classroom.school as any).logoUrl || undefined

    // 6. Pre-compute class averages for ranking
    const classAverages: Array<{ studentId: string; average: number }> = []
    for (const student of students) {
      const avgResult = await calculateGeneralAverage(student.id, periodId, dailySelectionMap)
      classAverages.push({ studentId: student.id, average: avgResult.success ? avgResult.data : 0 })
    }
    classAverages.sort((a, b) => b.average - a.average)
    const totalStudents = classAverages.length

    // 7. Build report card data for each student
    const reportCards: ReportCardData[] = []

    for (const student of students) {
      const schoolGradeId = student.classroom?.schoolGradeId ?? null
      const trackId = student.classroom?.trackId ?? null

      // Subject averages with daily selection applied
      const subjectAverages: Array<{
        name: string
        coefficient: number
        dailyAverage: number
        examAverage: number
        weightedAverage: number
        finalNote: number
        rank: number
        totalStudents: number
      }> = []

      // Get all subjects with grades for this student in this period
      const grades = await prisma.grade.findMany({
        where: {
          studentId: student.id,
          assessment: { periodId, schoolId },
        },
        include: {
          assessment: {
            include: { subject: { select: { id: true, name: true, coefficient: true } } },
          },
        },
      })

      const uniqueSubjects = Array.from(
        new Map(
          grades
            .filter((g) => g.assessment?.subject?.id)
            .map((g) => [g.assessment.subject.id, g.assessment.subject])
        ).values()
      )

      for (const subject of uniqueSubjects) {
        const selectedDailyIds = dailySelectionMap.get(subject.id)
        const [avgResult, coeff] = await Promise.all([
          calculateSubjectAverage(student.id, subject.id, periodId, selectedDailyIds),
          schoolGradeId
            ? getEffectiveCoefficient(subject.id, schoolGradeId, trackId, schoolId)
            : Promise.resolve(subject.coefficient),
        ])
        if (avgResult.success) {
          // Get individual daily and exam averages
          const subjectGrades = grades.filter(
            (g) => g.assessment?.subject?.id === subject.id
          )

          let dailySum = 0
          let dailyCount = 0
          let examSum = 0
          let examCount = 0

          for (const grade of subjectGrades) {
            const isSelected =
              selectedDailyIds === undefined || selectedDailyIds === null
                ? true
                : selectedDailyIds.includes(grade.assessment.id)

            if (grade.assessment.type === "EXAM") {
              examSum += grade.value
              examCount++
            } else if (isSelected) {
              dailySum += grade.value
              dailyCount++
            }
          }

          const dailyAverage = dailyCount > 0 ? dailySum / dailyCount : 0
          const examAverage = examCount > 0 ? examSum / examCount : 0
          const weightedAverage = avgResult.data
          const finalNote = coeff * weightedAverage

          // Calculate subject rank
          const subjectRankResult = await calculateSubjectRank(student.id, subject.id, classroomId, periodId, dailySelectionMap)

          subjectAverages.push({
            name: subject.name,
            coefficient: coeff,
            dailyAverage,
            examAverage,
            weightedAverage,
            finalNote,
            rank: subjectRankResult.success ? subjectRankResult.data.rank : 0,
            totalStudents: subjectRankResult.success ? subjectRankResult.data.totalStudents : 0,
          })
        }
      }

      // General average (using dailySelectionMap)
      const generalAvgResult = await calculateGeneralAverage(student.id, periodId, dailySelectionMap)
      const generalAverage = generalAvgResult.success ? generalAvgResult.data : 0

      // Rank
      const rankIndex = classAverages.findIndex((c) => c.studentId === student.id)
      const classRank = rankIndex >= 0 ? rankIndex + 1 : 0

      // Calculate appreciation
      const calculatedAppreciation = calculateAppreciation(generalAverage)

      // Calculate total notes and coefficients
      const totalNotes = calculateTotalNotes(subjectAverages.map((s) => ({
        subjectId: "",
        subjectName: s.name,
        coefficient: s.coefficient,
        average: s.weightedAverage,
      })))
      const totalCoefficients = calculateTotalCoefficients(subjectAverages.map((s) => ({
        subjectId: "",
        subjectName: s.name,
        coefficient: s.coefficient,
        average: s.weightedAverage,
      })))

      // Get student details for the report card
      const studentDetails = await prisma.student.findUnique({
        where: { id: student.id },
        select: {
          dateOfBirth: true,
          classNumber: true,
          sex: true,
        },
      })

      const reportCardData: ReportCardData = {
        schoolName: classroom.school.name,
        schoolAddress: classroom.school.address || undefined,
        schoolLogoUrl,
        schoolYear: period.schoolYear,
        periodName: period.name,
        studentFirstName: student.firstName || "",
        studentLastName: student.lastName,
        dateOfBirth: studentDetails?.dateOfBirth ? studentDetails.dateOfBirth.toISOString().split("T")[0] : undefined,
        className,
        classNumber: studentDetails?.classNumber?.toString() || undefined,
        sex: studentDetails?.sex || undefined,
        subjects: subjectAverages,
        totalNotes,
        totalCoefficients,
        generalAverage,
        classRank,
        totalStudents,
        appreciation: calculatedAppreciation || undefined,
      }

      reportCards.push(reportCardData)
    }

    // 8. Generate PDF using react-pdf
    const pdfBuffer = await generateClassReportPdfBuffer({
      className,
      periodName: period.name,
      schoolYear: period.schoolYear,
      reportCards,
    })
    const pdfBase64 = pdfBuffer.toString("base64")

    const periodSafe = period.name.replace(/\s+/g, "_")
    const classSafe = className.replace(/\s+/g, "_")
    const fileName = `Bulletins_${classSafe}_${periodSafe}.pdf`

    return { success: true, data: { pdfBase64, fileName } }
  } catch (error: any) {
    console.error("Error generating class report cards PDF:", error)
    return { success: false, error: "Erreur lors de la génération du bulletin de classe" }
  }
}
