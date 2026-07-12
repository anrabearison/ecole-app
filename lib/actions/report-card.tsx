"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/lib/utils"
import { calculateSubjectAverage, calculateGeneralAverage, calculateClassRank, getStudentSubjectAverages } from "./average"
import { getReportCardComment } from "./report-card-comment"
import { ReportCardDocument, type ReportCardData } from "@/lib/pdf/report-card"
import { generateReportCardPdfBuffer } from "@/lib/pdf/generate-pdf"

/**
 * Generate a PDF report card for a student in a period
 * SCHOOL_ADMIN/STAFF_ADMIN can generate for any student in their school
 * STUDENT can only generate their own report card
 */
export async function generateReportCardPdf(studentId: string, periodId: string): Promise<ActionResult<{ pdfBuffer: Buffer; fileName: string }>> {
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
      schoolYear: period.schoolYear,
      periodName: period.name,
      studentFirstName: student.firstName,
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

    const fileName = `Bulletin_${student.lastName}_${student.firstName}_${period.name.replace(/\s+/g, "_")}.pdf`

    return { success: true, data: { pdfBuffer: pdfStream as Buffer, fileName } }
  } catch (error: any) {
    console.error("Error generating report card PDF:", error)
    return { success: false, error: "Erreur lors de la génération du bulletin PDF" }
  }
}
