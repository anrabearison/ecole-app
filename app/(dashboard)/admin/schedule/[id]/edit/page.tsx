"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { updateScheduleSlot, listScheduleSlotsForAdmin } from "@/lib/actions/schedule-slot"
import { listClassrooms } from "@/lib/actions/classroom"
import { listRooms } from "@/lib/actions/room"
import { listTeacherSubjectsByClassroom } from "@/lib/actions/teacher-subject"
import { getSchoolScheduleSettings } from "@/lib/actions/school"
import {
  scheduleSlotUpdateSchema,
  generateTimeSlots,
  timeToMinutes,
  type ScheduleSlotUpdateInput,
} from "@/lib/validations/schedule-slot"
import { Button } from "@/components/ui/button"
import type { ScheduleSlotWithRelations } from "@/lib/actions/schedule-slot"
import { useToast } from "@/lib/hooks/useToast"

export default function EditScheduleSlotPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { success: showSuccess, error: showError } = useToast()

  const [slot, setSlot] = useState<ScheduleSlotWithRelations | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [classrooms, setClassrooms] = useState<
    Array<{ id: string; section: string; schoolYear: string; schoolGrade: { name: string } }>
  >([])
  const [rooms, setRooms] = useState<Array<{ id: string; name: string }>>([])
  const [teacherSubjects, setTeacherSubjects] = useState<
    Array<{ teacher: { id: string; firstName: string | null; lastName: string }; subject: { id: string; name: string } }>
  >([])
  const [timeSlotsOptions, setTimeSlotsOptions] = useState<{ value: string; label: string; isBreak: boolean }[]>([])
  const [slotDuration, setSlotDuration] = useState<number>(60)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<ScheduleSlotUpdateInput>({
    resolver: zodResolver(scheduleSlotUpdateSchema),
  })

  const watchedClassroomId = useWatch({ control, name: "classroomId" })
  const watchedSubjectId = useWatch({ control, name: "subjectId" })
  const watchedStartTime = useWatch({ control, name: "startTime" })

  // Load static data + the slot itself
  useEffect(() => {
    async function loadAll() {
      const [classroomsResult, roomsResult, settingsResult, slotsResult] = await Promise.all([
        listClassrooms(),
        listRooms(),
        getSchoolScheduleSettings(),
        listScheduleSlotsForAdmin(),
      ])

      if (classroomsResult.success) setClassrooms(classroomsResult.data)
      if (roomsResult.success) setRooms(roomsResult.data)

      if (settingsResult.success) {
        const { scheduleStartTime, morningEndTime, afternoonStartTime, scheduleEndTime, slotDurationMinutes } =
          settingsResult.data
        setSlotDuration(slotDurationMinutes)
        setTimeSlotsOptions(
          generateTimeSlots(scheduleStartTime, morningEndTime, afternoonStartTime, scheduleEndTime, slotDurationMinutes)
        )
      }

      if (slotsResult.success) {
        const found = slotsResult.data.find((s) => s.id === id)
        if (found) {
          setSlot(found)
          // Pre-fill the form
          reset({
            classroomId: found.classroomId,
            subjectId: found.subjectId,
            teacherId: found.teacherId,
            day: found.day,
            startTime: found.startTime,
            endTime: found.endTime,
            roomId: found.roomId ?? "",
          })
        } else {
          setLoadError("Créneau introuvable.")
        }
      } else {
        setLoadError("Erreur lors du chargement du créneau.")
      }
    }
    loadAll()
  }, [id, reset])

  // Load teacher-subjects when classroomId changes
  useEffect(() => {
    async function loadTeacherSubjects() {
      if (!watchedClassroomId) {
        setTeacherSubjects([])
        return
      }
      const result = await listTeacherSubjectsByClassroom(watchedClassroomId)
      if (result.success) {
        setTeacherSubjects(result.data)
      } else {
        setTeacherSubjects([])
      }
    }
    loadTeacherSubjects()
  }, [watchedClassroomId])

  // Auto-update endTime when startTime changes
  useEffect(() => {
    if (watchedStartTime) {
      const startMins = timeToMinutes(watchedStartTime)
      const endMins = startMins + slotDuration
      const h = Math.floor(endMins / 60)
      const m = endMins % 60
      setValue("endTime", `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
    }
  }, [watchedStartTime, slotDuration, setValue])

  const availableSubjects = Array.from(new Map(teacherSubjects.map((ts) => [ts.subject.id, ts.subject])).values())

  const availableTeachers = watchedSubjectId
    ? teacherSubjects.filter((ts) => ts.subject.id === watchedSubjectId).map((ts) => ts.teacher)
    : []

  const isEPS = watchedSubjectId && teacherSubjects.find((ts) => ts.subject.id === watchedSubjectId)?.subject.name === "EPS"

  const getDisplayName = (classroom: { schoolGrade: { name: string }; section: string; schoolYear: string }) =>
    `${classroom.schoolGrade.name} ${classroom.section} (${classroom.schoolYear})`

  const onSubmit = async (data: ScheduleSlotUpdateInput) => {
    setIsSubmitting(true)
    setWarnings([])

    const result = await updateScheduleSlot(id, data)

    if (result.success) {
      showSuccess("Créneau modifié avec succès")
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings)
      }
      // Navigate back to schedule page preserving the state
      const mode = searchParams.get("mode") || "classroom"
      const selectedId = searchParams.get("selectedId") || ""
      router.push(`/admin/schedule?mode=${mode}&selectedId=${selectedId}`)
    } else {
      showError(result.error)
    }

    setIsSubmitting(false)
  }

  const handleCancel = () => {
    const mode = searchParams.get("mode") || "classroom"
    const selectedId = searchParams.get("selectedId") || ""
    router.push(`/admin/schedule?mode=${mode}&selectedId=${selectedId}`)
  }

  if (loadError) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{loadError}</p>
        </div>
        <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 hover:underline">
          ← Retour
        </button>
      </div>
    )
  }

  if (!slot) {
    return (
      <div className="p-6 text-center text-gray-500">Chargement du créneau...</div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleCancel}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Retour
        </button>
        <h1 className="text-2xl font-bold">Modifier le créneau</h1>
      </div>

      {warnings.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 font-medium mb-2">Attention :</p>
          <ul className="text-yellow-800 text-sm list-disc list-inside">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Classroom */}
        <div>
          <label className="block text-sm font-medium mb-1">Classe</label>
          <select {...register("classroomId")} className="w-full border rounded px-3 py-2">
            <option value="">Sélectionner une classe</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {getDisplayName(classroom)}
              </option>
            ))}
          </select>
          {errors.classroomId && <p className="text-red-600 text-sm mt-1">{errors.classroomId.message}</p>}
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium mb-1">Matière</label>
          <select
            {...register("subjectId")}
            disabled={!watchedClassroomId || teacherSubjects.length === 0}
            className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
          >
            <option value="">Sélectionner une matière</option>
            {availableSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjectId && <p className="text-red-600 text-sm mt-1">{errors.subjectId.message}</p>}
        </div>

        {/* Teacher */}
        <div>
          <label className="block text-sm font-medium mb-1">Enseignant</label>
          <select
            {...register("teacherId")}
            disabled={!watchedSubjectId || availableTeachers.length === 0}
            className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
          >
            <option value="">Sélectionner un enseignant</option>
            {availableTeachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.firstName ? `${teacher.firstName} ${teacher.lastName}` : teacher.lastName}
              </option>
            ))}
          </select>
          {errors.teacherId && <p className="text-red-600 text-sm mt-1">{errors.teacherId.message}</p>}
        </div>

        {/* Day */}
        <div>
          <label className="block text-sm font-medium mb-1">Jour</label>
          <select {...register("day")} className="w-full border rounded px-3 py-2">
            <option value="MONDAY">Lundi</option>
            <option value="TUESDAY">Mardi</option>
            <option value="WEDNESDAY">Mercredi</option>
            <option value="THURSDAY">Jeudi</option>
            <option value="FRIDAY">Vendredi</option>
            <option value="SATURDAY">Samedi</option>
          </select>
          {errors.day && <p className="text-red-600 text-sm mt-1">{errors.day.message}</p>}
        </div>

        {/* Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Heure de début</label>
            {timeSlotsOptions.length > 0 ? (
              <select {...register("startTime")} className="w-full border rounded px-3 py-2">
                <option value="">Sélectionner l&apos;heure</option>
                {timeSlotsOptions.map((slot) => (
                  <option key={slot.value} value={slot.value} disabled={slot.isBreak}>
                    {slot.label} {slot.isBreak ? "(Pause repas)" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input type="time" {...register("startTime")} className="w-full border rounded px-3 py-2" />
            )}
            {errors.startTime && <p className="text-red-600 text-sm mt-1">{errors.startTime.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Heure de fin</label>
            <input type="time" {...register("endTime")} className="w-full border rounded px-3 py-2" />
            {errors.endTime && <p className="text-red-600 text-sm mt-1">{errors.endTime.message}</p>}
          </div>
        </div>

        {/* Room (hidden for EPS) */}
        {!isEPS && (
          <div>
            <label className="block text-sm font-medium mb-1">Salle</label>
            <select {...register("roomId")} className="w-full border rounded px-3 py-2">
              <option value="">Sélectionner une salle</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            {errors.roomId && <p className="text-red-600 text-sm mt-1">{errors.roomId.message}</p>}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/schedule")}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </div>
  )
}
