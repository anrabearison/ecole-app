"use client"

import type { ScheduleSlotWithRelations } from "@/lib/actions/schedule-slot"
import type { ScheduleSettings } from "@/lib/actions/school"

interface ScheduleViewProps {
  slots: ScheduleSlotWithRelations[]
  scheduleSettings?: ScheduleSettings
}

const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const
const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
}

const DEFAULT_SETTINGS: ScheduleSettings = {
  scheduleStartTime: "07:00",
  morningEndTime: "12:00",
  afternoonStartTime: "14:00",
  scheduleEndTime: "18:00",
  slotDurationMinutes: 60,
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number)
  return h * 60 + m
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

export function ScheduleView({ slots, scheduleSettings }: ScheduleViewProps) {
  const settings = scheduleSettings || DEFAULT_SETTINGS
  const { scheduleStartTime, morningEndTime, afternoonStartTime, scheduleEndTime, slotDurationMinutes } = settings

  // Group slots by day
  const slotsByDay: Record<string, ScheduleSlotWithRelations[]> = {}
  WEEKDAYS.forEach((day) => {
    slotsByDay[day] = slots.filter((slot) => slot.day === day)
  })

  // Build time slot ranges
  const startMins = timeToMinutes(scheduleStartTime)
  const morningEndMins = timeToMinutes(morningEndTime)
  const afternoonStartMins = timeToMinutes(afternoonStartTime)
  const endMins = timeToMinutes(scheduleEndTime)

  type TimeInterval = {
    startStr: string
    endStr: string
    startMins: number
    endMins: number
    isBreak: boolean
  }

  const intervals: TimeInterval[] = []

  // Morning slots
  for (let t = startMins; t < morningEndMins; t += slotDurationMinutes) {
    const nextT = Math.min(t + slotDurationMinutes, morningEndMins)
    intervals.push({
      startStr: minutesToTime(t),
      endStr: minutesToTime(nextT),
      startMins: t,
      endMins: nextT,
      isBreak: false,
    })
  }

  // Break slot (if morningEnd < afternoonStart)
  if (morningEndMins < afternoonStartMins) {
    intervals.push({
      startStr: minutesToTime(morningEndMins),
      endStr: minutesToTime(afternoonStartMins),
      startMins: morningEndMins,
      endMins: afternoonStartMins,
      isBreak: true,
    })
  }

  // Afternoon slots
  for (let t = afternoonStartMins; t < endMins; t += slotDurationMinutes) {
    const nextT = Math.min(t + slotDurationMinutes, endMins)
    intervals.push({
      startStr: minutesToTime(t),
      endStr: minutesToTime(nextT),
      startMins: t,
      endMins: nextT,
      isBreak: false,
    })
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b border-r border-gray-300 px-4 py-3 bg-gray-100 text-left font-semibold text-gray-700 w-32">
              Horaire
            </th>
            {WEEKDAYS.map((day) => (
              <th key={day} className="border-b border-r border-gray-300 px-4 py-3 bg-gray-100 text-center font-semibold text-gray-700">
                {WEEKDAY_LABELS[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {intervals.map((interval, idx) => {
            if (interval.isBreak) {
              return (
                <tr key={`break-${idx}`} className="bg-gray-100/80">
                  <td className="border-b border-r border-gray-300 px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap bg-gray-200/60">
                    {interval.startStr} - {interval.endStr}
                  </td>
                  <td
                    colSpan={WEEKDAYS.length}
                    className="border-b border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-500 bg-stripes bg-gray-100"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 10px, #e5e7eb 10px, #e5e7eb 20px)",
                    }}
                  >
                    🍽️ Pause méridienne ({interval.startStr} - {interval.endStr})
                  </td>
                </tr>
              )
            }

            return (
              <tr key={`slot-${idx}`} className="hover:bg-gray-50/50">
                <td className="border-b border-r border-gray-300 px-4 py-3 text-xs font-medium text-gray-600 whitespace-nowrap bg-gray-50">
                  {interval.startStr} - {interval.endStr}
                </td>
                {WEEKDAYS.map((day) => {
                  const matchingSlot = slotsByDay[day].find((s) => {
                    const sStart = timeToMinutes(s.startTime)
                    const sEnd = timeToMinutes(s.endTime)
                    return sStart < interval.endMins && sEnd > interval.startMins
                  })

                  if (!matchingSlot) {
                    return (
                      <td key={`${day}-${idx}`} className="border-b border-r border-gray-300 px-2 py-2 bg-white h-16" />
                    )
                  }

                  // Render cell if interval start matches slot start (or first interval matching)
                  const sStart = timeToMinutes(matchingSlot.startTime)
                  if (sStart !== interval.startMins && sStart > interval.startMins) {
                    return null
                  }

                  return (
                    <td
                      key={`${day}-${idx}`}
                      className="border-b border-r border-gray-300 px-3 py-2 bg-blue-50/80 border-l-4 border-l-blue-600 h-16 text-left shadow-xs"
                    >
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-blue-900">{matchingSlot.subject.name}</div>
                        <div className="text-gray-700 font-medium">
                          {matchingSlot.teacher.firstName} {matchingSlot.teacher.lastName}
                        </div>
                        <div className="text-gray-500 text-[11px]">
                          {matchingSlot.classroom.schoolGrade.name} {matchingSlot.classroom.section}
                          {matchingSlot.room && ` • ${matchingSlot.room.name}`}
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

