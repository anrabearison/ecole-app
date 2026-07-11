import { listScheduleSlotsForStudent } from "@/lib/actions/schedule-slot"
import { ScheduleView } from "@/components/ScheduleView"

export default async function StudentSchedulePage() {
  const result = await listScheduleSlotsForStudent()

  if (!result.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Mon emploi du temps</h1>
        <div className="text-red-600">{result.error}</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mon emploi du temps</h1>
      <ScheduleView slots={result.data} />
    </div>
  )
}
