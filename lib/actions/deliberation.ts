"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/lib/utils"
import { calculateGeneralAverage } from "./average"
import { deliberationObservationSchema } from "@/lib/validations/deliberation"
import { generateAnnualReportPdfBuffer } from "@/lib/pdf/generate-pdf"
import type { AnnualReportData } from "@/lib/pdf/annual-report"
import type { DeliberationDecision } from "@prisma/client"

export type DeliberationWithRelations = {
  id: string
  schoolYear: string
  studentAverage: number
  decision: DeliberationDecision
  observations: string | null
  studentId: string
  student: {
    id: string
    firstName: string
    lastName: string
  }
  schoolId: string
  createdAt: Date
  updatedAt: Date
}

export async function runDeliberationForClassroom(
  classroomId: string,
  schoolYear: string
): Promise<ActionResult<{ processed: number }>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const schoolId = session.user.schoolId

  if (!can(session.user.role, "update", "deliberation", { schoolId })) {
    return { success: false, error: "Forbidden" }
  }

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    })

    if (!classroom || classroom.schoolId !== session.user.schoolId) {
      return { success: false, error: "Classroom not found" }
    }

    if (classroom.schoolYear !== schoolYear) {
      return { success: false, error: "School year mismatch" }
    }

    const periods = await prisma.period.findMany({
      where: {
        schoolId: session.user.schoolId,
        schoolYear,
      },
      orderBy: { order: "asc" },
      select: { id: true },
    })

    if (periods.length === 0) {
      return { success: false, error: "Aucune période trouvée pour cette année scolaire" }
    }

    const students = await prisma.student.findMany({
      where: {
        schoolId: session.user.schoolId,
        classroomId,
      },
      select: {
        id: true,
      },
    })

    const deliberationPayloads: Array<{
      studentId: string
      studentAverage: number
      decision: DeliberationDecision
    }> = []

    for (const student of students) {
      const periodAverages: number[] = []

      for (const period of periods) {
        const avgResult = await calculateGeneralAverage(student.id, period.id)
        if (!avgResult.success) {
          return { success: false, error: avgResult.error }
        }
        periodAverages.push(avgResult.data)
      }

      const studentAverage = periodAverages.length > 0
        ? periodAverages.reduce((sum, value) => sum + value, 0) / periodAverages.length
        : 0

      const decision: DeliberationDecision = studentAverage >= classroom.passingThreshold
        ? "PROMOTED"
        : "REPEATED"

      deliberationPayloads.push({ studentId: student.id, studentAverage, decision })
    }

    await prisma.$transaction(
      deliberationPayloads.map((payload) =>
        prisma.deliberation.upsert({
          where: {
            studentId_schoolYear: {
              studentId: payload.studentId,
              schoolYear,
            },
          },
          create: {
            studentId: payload.studentId,
            schoolId,
            schoolYear,
            studentAverage: payload.studentAverage,
            decision: payload.decision,
          },
          update: {
            studentAverage: payload.studentAverage,
            decision: payload.decision,
          },
        })
      )
    )

    return { success: true, data: { processed: deliberationPayloads.length } }
  } catch (error: any) {
    console.error("Error running deliberation for classroom:", error)
    return { success: false, error: "Erreur lors de l'exécution de la délibération" }
  }
}

export async function updateDeliberationObservations(
  studentId: string,
  schoolYear: string,
  observations: string | null
): Promise<ActionResult<DeliberationWithRelations>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  if (!can(session.user.role, "update", "deliberation", { schoolId: session.user.schoolId })) {
    return { success: false, error: "Forbidden" }
  }

  const validation = deliberationObservationSchema.safeParse({ studentId, schoolYear, observations })

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    const deliberation = await prisma.deliberation.findUnique({
      where: {
        studentId_schoolYear: {
          studentId,
          schoolYear,
        },
      },
    })

    if (!deliberation || deliberation.schoolId !== session.user.schoolId) {
      return { success: false, error: "Deliberation not found" }
    }

    const updated = await prisma.deliberation.update({
      where: {
        studentId_schoolYear: {
          studentId,
          schoolYear,
        },
      },
      data: {
        observations: validation.data.observations,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return { success: true, data: updated as DeliberationWithRelations }
  } catch (error: any) {
    console.error("Error updating deliberation observations:", error)
    return { success: false, error: "Erreur lors de la mise à jour des observations" }
  }
}

export async function getDeliberation(
  studentId: string,
  schoolYear: string
): Promise<ActionResult<DeliberationWithRelations | null>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const schoolId = session.user.schoolId
  const currentStudentId = session.user.studentId ?? undefined
  const isStudent = session.user.role === "STUDENT"
  if (isStudent && currentStudentId !== studentId) {
    return { success: false, error: "Forbidden" }
  }

  if (!can(session.user.role, "view", "deliberation", {
    studentId: isStudent ? currentStudentId : undefined,
    schoolId,
  })) {
    return { success: false, error: "Forbidden" }
  }

  try {
    const deliberation = await prisma.deliberation.findUnique({
      where: {
        studentId_schoolYear: {
          studentId,
          schoolYear,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!deliberation) {
      return { success: true, data: null }
    }

    if (deliberation.schoolId !== session.user.schoolId) {
      return { success: false, error: "Forbidden" }
    }

    return { success: true, data: deliberation as DeliberationWithRelations }
  } catch (error: any) {
    console.error("Error getting deliberation:", error)
    return { success: false, error: "Erreur lors du chargement de la délibération" }
  }
}

export async function listDeliberationsForClassroom(
  classroomId: string,
  schoolYear: string
): Promise<ActionResult<Array<{
  studentId: string
  studentFirstName: string
  studentLastName: string
  studentAverage: number
  decision: DeliberationDecision
  observations: string | null
}>>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  if (!can(session.user.role, "view", "deliberation", { schoolId: session.user.schoolId })) {
    return { success: false, error: "Forbidden" }
  }

  try {
    const students = await prisma.student.findMany({
      where: {
        schoolId: session.user.schoolId,
        classroomId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        deliberations: {
          where: { schoolYear },
          select: {
            studentAverage: true,
            decision: true,
            observations: true,
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    })

    return {
      success: true,
      data: students.map((student) => ({
        studentId: student.id,
        studentFirstName: student.firstName,
        studentLastName: student.lastName,
        studentAverage: student.deliberations[0]?.studentAverage ?? 0,
        decision: student.deliberations[0]?.decision ?? "REPEATED",
        observations: student.deliberations[0]?.observations ?? null,
      })),
    }
  } catch (error: any) {
    console.error("Error listing deliberations for classroom:", error)
    return { success: false, error: "Erreur lors du chargement des délibérations" }
  }
}

export async function generateAnnualReportPdf(
  studentId: string,
  schoolYear: string
): Promise<ActionResult<{ pdfBuffer: Buffer; fileName: string }>> {
  const session = await auth()

  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  if (!session.user.schoolId) {
    return { success: false, error: "School ID is required" }
  }

  const schoolId = session.user.schoolId
  const currentStudentId = session.user.studentId ?? undefined
  const isStudent = session.user.role === "STUDENT"
  if (isStudent && currentStudentId !== studentId) {
    return { success: false, error: "Forbidden" }
  }

  if (!can(session.user.role, "view", "deliberation", {
    studentId: isStudent ? currentStudentId : undefined,
    schoolId,
  })) {
    return { success: false, error: "Forbidden" }
  }

  try {
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

    if (!student || student.schoolId !== session.user.schoolId) {
      return { success: false, error: "Student not found" }
    }

    const deliberation = await prisma.deliberation.findUnique({
      where: {
        studentId_schoolYear: {
          studentId,
          schoolYear,
        },
      },
    })

    if (!deliberation) {
      return { success: false, error: "Deliberation not found" }
    }

    const periods = await prisma.period.findMany({
      where: {
        schoolId: session.user.schoolId,
        schoolYear,
      },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
      },
    })

    const periodResults: Array<{ periodName: string; average: number }> = []

    for (const period of periods) {
      const generalAvgResult = await calculateGeneralAverage(studentId, period.id)
      if (!generalAvgResult.success) {
        return { success: false, error: generalAvgResult.error }
      }
      periodResults.push({
        periodName: period.name,
        average: generalAvgResult.data,
      })
    }

    const annualAverage = periodResults.length > 0
      ? periodResults.reduce((sum, item) => sum + item.average, 0) / periodResults.length
      : 0

    let className = student.classroom?.schoolGrade?.name || ""
    if (student.classroom?.track) {
      className += ` ${student.classroom.track.name}`
    }
    if (student.classroom?.section) {
      className += ` ${student.classroom.section}`
    }

    const decisionLabel = deliberation.decision === "PROMOTED"
      ? "Admis en classe supérieure"
      : "Redouble"

    const reportData: AnnualReportData = {
      schoolName: student.school.name,
      schoolAddress: student.school.address || undefined,
      schoolYear,
      studentFirstName: student.firstName,
      studentLastName: student.lastName,
      className,
      periodAverages: periodResults,
      annualAverage,
      decision: decisionLabel,
      observations: deliberation.observations || undefined,
    }

    const pdfStream = await generateAnnualReportPdfBuffer(reportData)

    const fileName = `Bulletin_Annuel_${student.lastName}_${student.firstName}_${schoolYear.replace(/\s+/g, "_")}.pdf`

    return { success: true, data: { pdfBuffer: pdfStream as Buffer, fileName } }
  } catch (error: any) {
    console.error("Error generating annual report PDF:", error)
    return { success: false, error: "Erreur lors de la génération du bulletin annuel" }
  }
}
