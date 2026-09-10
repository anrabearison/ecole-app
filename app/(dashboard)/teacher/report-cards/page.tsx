"use server"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
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

  const [teacherSubjectsResult, periodsResult] = await Promise.all([
    listTeacherSubjects(session.user.teacherId || undefined),
    listPeriods(),
  ])

  const teacherSubjects = teacherSubjectsResult.success ? teacherSubjectsResult.data : []
  const periods = periodsResult.success ? periodsResult.data : []

  // Build unique classrooms from teacher's assignments
  const classroomMap = new Map<string, { id: string; name: string; schoolYear: string }>()
  for (const ts of teacherSubjects) {
    if (!classroomMap.has(ts.classroom.id)) {
      classroomMap.set(ts.classroom.id, {
        id: ts.classroom.id,
        name: `${ts.classroom.schoolGrade.name} ${ts.classroom.section}`,
        schoolYear: ts.classroom.schoolYear,
      })
    }
  }

  // If a classroom + subject + period are selected, load the daily assessment selection
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

  // Filter subjects for the selected classroom
  const subjectsForClassroom = params.classroomId
    ? teacherSubjects
        .filter((ts) => ts.classroom.id === params.classroomId)
        .map((ts) => ({ id: ts.subject.id, name: ts.subject.name }))
    : []

  return (
    <ReportCardsClient
      classrooms={Array.from(classroomMap.values())}
      periods={periods}
      subjectsForClassroom={subjectsForClassroom}
      selectionData={selectionData}
      selectedClassroomId={params.classroomId}
      selectedSubjectId={params.subjectId}
      selectedPeriodId={params.periodId}
    />
  )
}
