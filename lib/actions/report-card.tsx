"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/lib/utils"
import { calculateSubjectAverage, calculateGeneralAverage, calculateClassRank, getStudentSubjectAverages } from "./average"
import { generateReportCardPdfBuffer, type ReportCardData } from "@/lib/pdf/generate-pdf"
import { generatePdfFromHtml } from "@/lib/pdf/browser"
import { renderReportCardHtml } from "@/lib/pdf/report-card-template"
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
      include: {
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
    const classRankResult = await calculateClassRank(studentId, student.classroomId!, periodId)
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

    // Prepare report card data
    const reportCardData: ReportCardData = {
      schoolName: student.school.name,
      schoolAddress: student.school.address || undefined,
      schoolLogoBase64: (student.school as any).logoUrl || undefined,
      schoolYear: period.schoolYear,
      periodName: period.name,
      studentFirstName: student.firstName || "",
      studentLastName: student.lastName,
      className,
      subjects: subjectAveragesResult.data.map((sa) => ({
        name: sa.subjectName,
        coefficient: sa.coefficient,
        average: sa.average,
      })),
      generalAverage: generalAverageResult.data,
      classRank: classRankResult.data.rank,
      totalStudents: classRankResult.data.totalStudents,
      appreciation,
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

    const schoolLogoBase64 = (classroom.school as any).logoUrl || undefined

    // 6. Pre-compute class averages for ranking
    const classAverages: Array<{ studentId: string; average: number }> = []
    for (const student of students) {
      const avgResult = await calculateGeneralAverage(student.id, periodId, dailySelectionMap)
      classAverages.push({ studentId: student.id, average: avgResult.success ? avgResult.data : 0 })
    }
    classAverages.sort((a, b) => b.average - a.average)
    const totalStudents = classAverages.length

    // 7. Build HTML for each student — all in a single document, separated by page breaks
    const allPages: string[] = []

    for (const student of students) {
      const schoolGradeId = student.classroom?.schoolGradeId ?? null
      const trackId = student.classroom?.trackId ?? null

      // Subject averages with daily selection applied
      const subjectAverages: Array<{ name: string; coefficient: number; average: number }> = []

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
          subjectAverages.push({ name: subject.name, coefficient: coeff, average: avgResult.data })
        }
      }

      // General average (using dailySelectionMap)
      const generalAvgResult = await calculateGeneralAverage(student.id, periodId, dailySelectionMap)
      const generalAverage = generalAvgResult.success ? generalAvgResult.data : 0

      // Rank
      const rankIndex = classAverages.findIndex((c) => c.studentId === student.id)
      const classRank = rankIndex >= 0 ? rankIndex + 1 : 0

      // Appreciation comment
      const commentResult = await getReportCardComment(student.id, periodId)
      const appreciation = commentResult.success && commentResult.data ? commentResult.data.comment : undefined

      const reportCardData: ReportCardData = {
        schoolName: classroom.school.name,
        schoolAddress: classroom.school.address || undefined,
        schoolLogoBase64,
        schoolYear: period.schoolYear,
        periodName: period.name,
        studentFirstName: student.firstName || "",
        studentLastName: student.lastName,
        className,
        subjects: subjectAverages,
        generalAverage,
        classRank,
        totalStudents,
        appreciation,
      }

      allPages.push(renderReportCardHtml(reportCardData))
    }

    // 8. Combine all pages into a single HTML document with page breaks
    const combinedHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bulletins de la classe ${className} — ${period.name}</title>
  <style>
    @page { margin: 0; }
    .page-wrapper { page-break-after: always; }
    .page-wrapper:last-child { page-break-after: avoid; }
  </style>
</head>
<body style="margin:0;padding:0;">
  ${allPages.map((html) => {
    // Extract just the <body> content from each individual bulletin HTML
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    return `<div class="page-wrapper">${bodyMatch ? bodyMatch[1] : html}</div>`
  }).join("\n")}
</body>
</html>`

    // 9. Generate PDF
    const pdfBuffer = await generatePdfFromHtml(combinedHtml)
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
