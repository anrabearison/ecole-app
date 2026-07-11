"use client"

import type { ScheduleSlotWithRelations } from "@/lib/actions/schedule-slot"

interface ScheduleViewProps {
  slots: ScheduleSlotWithRelations[]
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

export function ScheduleView({ slots }: ScheduleViewProps) {
  // Group slots by day
  const slotsByDay: Record<string, ScheduleSlotWithRelations[]> = {}
  WEEKDAYS.forEach((day) => {
    slotsByDay[day] = slots.filter((slot) => slot.day === day)
  })

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2 bg-gray-50 text-left font-medium text-gray-700">
              Heure
            </th>
            {WEEKDAYS.map((day) => (
              <th key={day} className="border border-gray-300 px-4 py-2 bg-gray-50 text-center font-medium text-gray-700">
                {WEEKDAY_LABELS[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Generate time slots from 08:00 to 18:00 */}
          {Array.from({ length: 21 }, (_, i) => {
            const hour = 8 + Math.floor(i / 2)
            const minute = i % 2 === 0 ? "00" : "30"
            const timeLabel = `${hour.toString().padStart(2, "0")}:${minute}`
            const nextHour = minute === "00" ? hour : hour + 1
            const nextMinute = minute === "00" ? "30" : "00"
            const endTimeLabel = `${nextHour.toString().padStart(2, "0")}:${nextMinute}`

            return (
              <tr key={i}>
                <td className="border border-gray-300 px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700 whitespace-nowrap">
                  {timeLabel} - {endTimeLabel}
                </td>
                {WEEKDAYS.map((day) => {
                  const slot = slotsByDay[day].find((s) => {
                    const slotStart = parseInt(s.startTime.replace(":", ""))
                    const slotEnd = parseInt(s.endTime.replace(":", ""))
                    const currentStart = parseInt(timeLabel.replace(":", ""))
                    const currentEnd = parseInt(endTimeLabel.replace(":", ""))
                    return slotStart <= currentStart && slotEnd >= currentEnd
                  })

                  if (!slot) {
                    return (
                      <td key={`${day}-${i}`} className="border border-gray-300 px-2 py-2 bg-white h-16" />
                    )
                  }

                  // Only render if this is the first time slot of the slot's duration
                  const slotStart = parseInt(slot.startTime.replace(":", ""))
                  const currentStart = parseInt(timeLabel.replace(":", ""))
                  if (slotStart !== currentStart) {
                    return (
                      <td key={`${day}-${i}`} className="border border-gray-300 px-2 py-2 bg-white h-16" />
                    )
                  }

                  return (
                    <td
                      key={`${day}-${i}`}
                      className="border border-gray-300 px-2 py-2 bg-blue-50 h-16"
                      rowSpan={Math.ceil(
                        (parseInt(slot.endTime.replace(":", "")) - parseInt(slot.startTime.replace(":", ""))) / 30
                      )}
                    >
                      <div className="text-xs space-y-1">
                        <div className="font-medium text-gray-900">{slot.subject.name}</div>
                        <div className="text-gray-600">{slot.teacher.firstName} {slot.teacher.lastName}</div>
                        <div className="text-gray-500">{slot.classroom.schoolGrade.name} {slot.classroom.section}</div>
                        {slot.room && <div className="text-gray-500">{slot.room.name}</div>}
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
