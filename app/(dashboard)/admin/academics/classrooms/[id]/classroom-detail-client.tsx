"use client"

import { useState, useEffect } from "react"
import { ClassroomDeliberationSection } from "./deliberation-section"
import { ClassroomGradesSection } from "./grades-section"
import { CollapsibleSection } from "./collapsible-section"
import { StudentsSection } from "./students-section"
import { Users, FileText, GraduationCap } from "lucide-react"
import { listStudents } from "@/lib/actions/student"

interface ClassroomDetailClientProps {
  classroomId: string
  schoolYear: string
  periods: Array<{ id: string; name: string; schoolYear: string }>
}

export function ClassroomDetailClient({ classroomId, schoolYear, periods }: ClassroomDetailClientProps) {
  const [studentCount, setStudentCount] = useState<number>(0)
  const [loadingCount, setLoadingCount] = useState(true)

  useEffect(() => {
    const loadStudentCount = async () => {
      setLoadingCount(true)
      try {
        const result = await listStudents({ classroomId, pageSize: 1000 })
        if (result.success) {
          setStudentCount(result.data.length)
        }
      } catch (e) {
        console.error("Error loading student count:", e)
      } finally {
        setLoadingCount(false)
      }
    }

    loadStudentCount()
  }, [classroomId])

  return (
    <>
      {/* Notes & Bulletins */}
      <CollapsibleSection title="Notes & Bulletins" icon={<FileText className="w-4 h-4" />} defaultOpen={true}>
        <ClassroomGradesSection classroomId={classroomId} periods={periods} />
      </CollapsibleSection>

      {/* Élèves */}
      <CollapsibleSection
        title="Élèves"
        icon={<Users className="w-4 h-4" />}
        count={loadingCount ? undefined : studentCount}
        defaultOpen={false}
        onOpen={() => {}}
      >
        <StudentsSection classroomId={classroomId} />
      </CollapsibleSection>

      {/* Délibération annuelle */}
      <CollapsibleSection title="Délibération annuelle" icon={<GraduationCap className="w-4 h-4" />} defaultOpen={false}>
        <ClassroomDeliberationSection classroomId={classroomId} schoolYear={schoolYear} />
      </CollapsibleSection>
    </>
  )
}
