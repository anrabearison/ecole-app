"use client"

import { useState, useEffect, useRef } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X } from "lucide-react"
import { updateScheduleSlot } from "@/lib/actions/schedule-slot"
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

interface EditScheduleSlotDialogProps {
  slot: ScheduleSlotWithRelations
  onSuccess: () => void
  onCancel: () => void
}

export function EditScheduleSlotDialog({ slot, onSuccess, onCancel }: EditScheduleSlotDialogProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const { error: showError } = useToast()

  const [warnings, setWarnings] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  const [classrooms, setClassrooms] = useState<
    Array<{ id: string; section: string; schoolYear: string; schoolGrade: { name: string } }>
  >([])
  const [rooms, setRooms] = useState<Array<{ id: string; name: string }>>([])
  const [teacherSubjects, setTeacherSubjects] = useState<
    Array<{
      teacher: { id: string; firstName: string | null; lastName: string }
      subject: { id: string; name: string }
    }>
  >([])
  const [timeSlotsOptions, setTimeSlotsOptions] = useState<{ value: string; label: string; isBreak: boolean }[]>([])
  const [slotDuration, setSlotDuration] = useState<number>(60)

  const previousClassroomId = useRef(slot.classroomId)
  const previousSubjectId = useRef(slot.subjectId)

  const { register, control, handleSubmit, formState: { errors }, setValue, reset, watch } =
    useForm<ScheduleSlotUpdateInput>({
      resolver: zodResolver(scheduleSlotUpdateSchema),
      mode: "onChange", // Enable real-time validation
      defaultValues: {
        classroomId: slot.classroomId,
        subjectId: slot.subjectId,
        teacherId: slot.teacherId,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        roomId: slot.roomId ?? "",
      },
    })

  const watchedClassroomId = useWatch({ control, name: "classroomId" })
  const watchedSubjectId = useWatch({ control, name: "subjectId" })
  const watchedStartTime = useWatch({ control, name: "startTime" })

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onCancel])

  // Load ALL data in parallel (including teacherSubjects for the current slot),
  // THEN reset the form so options are available when values are set.
  useEffect(() => {
    async function loadAll() {
      setIsLoadingData(true)
      const [classroomsResult, roomsResult, settingsResult, teacherSubjectsResult] = await Promise.all([
        listClassrooms(),
        listRooms(),
        getSchoolScheduleSettings(),
        listTeacherSubjectsByClassroom(slot.classroomId),
      ])

      if (classroomsResult.success) setClassrooms(classroomsResult.data)
      if (roomsResult.success) setRooms(roomsResult.data)

      let duration = 60
      if (settingsResult.success) {
        const { scheduleStartTime, morningEndTime, afternoonStartTime, scheduleEndTime, slotDurationMinutes } =
          settingsResult.data
        duration = slotDurationMinutes
        setSlotDuration(slotDurationMinutes)
        setTimeSlotsOptions(
          generateTimeSlots(scheduleStartTime, morningEndTime, afternoonStartTime, scheduleEndTime, slotDurationMinutes)
        )
      }

      if (teacherSubjectsResult.success) setTeacherSubjects(teacherSubjectsResult.data)

      // Reset AFTER options are loaded so selects display the correct values
      reset({
        classroomId: slot.classroomId,
        subjectId: slot.subjectId,
        teacherId: slot.teacherId,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        roomId: slot.roomId ?? "",
      })

      setIsLoadingData(false)
    }

    loadAll()
  }, [slot, reset])

  // Reload teacher-subjects when the user manually changes classroom
  useEffect(() => {
    if (!watchedClassroomId || watchedClassroomId === previousClassroomId.current) return
    
    previousClassroomId.current = watchedClassroomId

    listTeacherSubjectsByClassroom(watchedClassroomId).then((result) => {
      if (result.success) setTeacherSubjects(result.data)
      else setTeacherSubjects([])
      
      // Reset subject & teacher when classroom changes manually
      setValue("subjectId", "")
      setValue("teacherId", "")
    })
  }, [watchedClassroomId, setValue])

  // Reset teacher when subject changes manually
  useEffect(() => {
    if (!watchedSubjectId || watchedSubjectId === previousSubjectId.current) return
    
    previousSubjectId.current = watchedSubjectId
    
    setValue("teacherId", "")
  }, [watchedSubjectId, setValue])

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

  // Available subjects are those that have teachers assigned in this classroom
  const availableSubjects = Array.from(
    new Map(teacherSubjects.map((ts) => [ts.subject.id, ts.subject])).values()
  )

  // Always include the current slot's subject in available subjects, even if it has no teacher assigned
  // This ensures the subject dropdown is never empty when editing an existing slot
  const currentSubjectId = watch("subjectId")
  const currentSubject = availableSubjects.find(s => s.id === currentSubjectId)
  
  // If current subject is not in availableSubjects (e.g., EPS with no teacher), add it from the slot data
  const slotSubject = slot.subject
  const displaySubjects = !currentSubject && slotSubject && !availableSubjects.find(s => s.id === slotSubject.id)
    ? [...availableSubjects, slotSubject]
    : availableSubjects

  const availableTeachers = watchedSubjectId
    ? teacherSubjects.filter((ts) => ts.subject.id === watchedSubjectId).map((ts) => ts.teacher)
    : []

  // Always include the current teacher in display options, even if not in teacherSubjects
  // This ensures the teacherId is never lost during editing
  const currentTeacherId = watch("teacherId")
  const currentTeacher = teacherSubjects.find((ts) => ts.teacher.id === currentTeacherId)?.teacher
  
  const displayTeachers = currentTeacher && !availableTeachers.find(t => t.id === currentTeacher.id)
    ? [...availableTeachers, currentTeacher]
    : availableTeachers

  const isEPS =
    watchedSubjectId &&
    teacherSubjects.find((ts) => ts.subject.id === watchedSubjectId)?.subject.name === "EPS"

  const getDisplayName = (classroom: {
    schoolGrade: { name: string }
    section: string
    schoolYear: string
  }) => `${classroom.schoolGrade.name} ${classroom.section} (${classroom.schoolYear})`

  const onSubmit = async (data: ScheduleSlotUpdateInput) => {
    setIsSubmitting(true)
    setWarnings([])
    const result = await updateScheduleSlot(slot.id, data)
    setIsSubmitting(false)

    if (result.success) {
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings)
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        onSuccess()
      }
    } else {
      showError(result.error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={(e) => { if (e.target === overlayRef.current) onCancel() }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Modifier le créneau</h2>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {isLoadingData ? (
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : (
            <>
              {warnings.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-medium text-sm mb-1">Attention :</p>
                  <ul className="text-yellow-800 text-sm list-disc list-inside space-y-0.5">
                    {warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              <form id="edit-slot-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Classroom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                  <select
                    {...register("classroomId")}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une classe</option>
                    {classrooms.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {getDisplayName(classroom)}
                      </option>
                    ))}
                  </select>
                  {errors.classroomId && <p className="text-red-600 text-xs mt-1">{errors.classroomId.message}</p>}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
                  <select
                    {...register("subjectId")}
                    disabled={!watchedClassroomId || displaySubjects.length === 0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">Sélectionner une matière</option>
                    {displaySubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  {!watchedClassroomId && (
                    <p className="text-xs text-gray-500 mt-1">Sélectionnez d'abord une classe</p>
                  )}
                  {errors.subjectId && <p className="text-red-600 text-xs mt-1">{errors.subjectId.message}</p>}
                </div>

                {/* Teacher */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enseignant</label>
                  <select
                    {...register("teacherId")}
                    disabled={!watchedSubjectId || displayTeachers.length === 0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">Sélectionner un enseignant</option>
                    {displayTeachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName ? `${teacher.firstName} ${teacher.lastName}` : teacher.lastName}
                      </option>
                    ))}
                  </select>
                  {errors.teacherId && <p className="text-red-600 text-xs mt-1">{errors.teacherId.message}</p>}
                </div>

                {/* Day */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jour</label>
                  <select
                    {...register("day")}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MONDAY">Lundi</option>
                    <option value="TUESDAY">Mardi</option>
                    <option value="WEDNESDAY">Mercredi</option>
                    <option value="THURSDAY">Jeudi</option>
                    <option value="FRIDAY">Vendredi</option>
                    <option value="SATURDAY">Samedi</option>
                  </select>
                  {errors.day && <p className="text-red-600 text-xs mt-1">{errors.day.message}</p>}
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début</label>
                    {timeSlotsOptions.length > 0 ? (
                      <select
                        {...register("startTime")}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner</option>
                        {timeSlotsOptions.map((s) => (
                          <option key={s.value} value={s.value} disabled={s.isBreak}>
                            {s.label} {s.isBreak ? "(Pause)" : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="time"
                        {...register("startTime")}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                    {errors.startTime && <p className="text-red-600 text-xs mt-1">{errors.startTime.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin</label>
                    <input
                      type="time"
                      {...register("endTime")}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.endTime && <p className="text-red-600 text-xs mt-1">{errors.endTime.message}</p>}
                  </div>
                </div>

                {/* Room */}
                {!isEPS && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
                    <select
                      {...register("roomId")}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Aucune salle</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                    {errors.roomId && <p className="text-red-600 text-xs mt-1">{errors.roomId.message}</p>}
                  </div>
                )}
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isLoadingData}>
            Annuler
          </Button>
          <Button type="submit" form="edit-slot-form" disabled={isSubmitting || isLoadingData}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </div>
    </div>
  )
}
