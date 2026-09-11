
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { listTeacherSubjects } from "@/lib/actions/teacher-subject"
import { listPeriods } from "@/lib/actions/period"
import { listDailyAssessmentsWithSelection } from "@/lib/actions/daily-grade-selection"
import { ReportCardsClient } from "./report-cards-client"

export default async function TeacherReportCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ classroomId?: string; subjectId?: string; periodId?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams

  const periodsResult = await listPeriods()
  const periods = periodsResult.success ? periodsResult.data : []

  let classrooms: Array<{ id: string; name: string; schoolYear: string }> = []
  let subjectsForClassroom: Array<{ id: string; name: string; dailyAssessmentCount?: number }> = []

  if (session.user.teacherId) {
    // Teacher: load classrooms and subjects assigned to this teacher
    const teacherSubjectsResult = await listTeacherSubjects(session.user.teacherId)
    const teacherSubjects = teacherSubjectsResult.success ? teacherSubjectsResult.data : []

    const classroomMap = new Map<string, { id: string; name: string; schoolYear: string }>()
    for (const ts of teacherSubjects) {
      if (!classroomMap.has(ts.classroom.id)) {
        classroomMap.set(ts.classroom.id, {
          id: ts.classroom.id,
          name: `${ts.classroom.schoolGrade?.name || ''} ${ts.classroom.section}`,
          schoolYear: ts.classroom.schoolYear,
        })
      }
    }
    classrooms = Array.from(classroomMap.values())

    if (params.classroomId) {
      const subjectMap = new Map<string, string>()
      for (const ts of teacherSubjects) {
        if (ts.classroom.id === params.classroomId) {
          subjectMap.set(ts.subject.id, ts.subject.name)
        }
      }
      subjectsForClassroom = Array.from(subjectMap.entries()).map(([id, name]) => ({ id, name }))
    }
  } else {
    // Admin / Staff: load all classrooms and subjects for the school
    const classroomsData = await prisma.classroom.findMany({
      where: session.user.schoolId ? { schoolId: session.user.schoolId } : {},
      select: {
        id: true,
        section: true,
        schoolYear: true,
        schoolGrade: { select: { name: true } },
      },
      orderBy: { section: "asc" },
    })

    classrooms = classroomsData.map((c) => ({
      id: c.id,
      name: `${c.schoolGrade?.name || ''} ${c.section}`,
      schoolYear: c.schoolYear,
    }))

    if (params.classroomId) {
      const subjectsData = await prisma.subject.findMany({
        where: session.user.schoolId ? { schoolId: session.user.schoolId } : {},
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
      subjectsForClassroom = subjectsData
    }
  }

  // If both classroom and period are selected, count daily assessments per subject
  if (params.classroomId && params.periodId && subjectsForClassroom.length > 0) {
    const counts = await prisma.assessment.groupBy({
      by: ["subjectId"],
      where: {
        classroomId: params.classroomId,
        periodId: params.periodId,
        type: "DAILY",
        schoolId: session.user.schoolId ? session.user.schoolId : undefined,
      },
      _count: { id: true },
    })

    const countMap = new Map(counts.map((c) => [c.subjectId, c._count.id]))

    subjectsForClassroom = subjectsForClassroom.map((s) => ({
      ...s,
      dailyAssessmentCount: countMap.get(s.id) || 0,
    }))
  }

  // Load daily assessment selection if classroom + subject + period are all selected
  let selectionData = null
  if (params.classroomId && params.subjectId && params.periodId) {
    const selectionResult = await listDailyAssessmentsWithSelection(
      params.classroomId,
      params.subjectId,
      params.periodId,
    )
    if (selectionResult.success) {
      selectionData = selectionResult.data
    }
  }

  return (
    <ReportCardsClient
      classrooms={classrooms}
      periods={periods}
      subjectsForClassroom={subjectsForClassroom}
      selectionData={selectionData}
      selectedClassroomId={params.classroomId}
      selectedSubjectId={params.subjectId}
      selectedPeriodId={params.periodId}
    />
  )
}
