"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createScheduleSlot } from "@/lib/actions/schedule-slot"
import { listClassrooms } from "@/lib/actions/classroom"
import { listRooms } from "@/lib/actions/room"
import { listTeacherSubjectsByClassroom } from "@/lib/actions/teacher-subject"
import { scheduleSlotSchema, type ScheduleSlotInput } from "@/lib/validations/schedule-slot"
import { Button } from "@/components/ui/button"

export default function NewScheduleSlotPage() {
  const [warnings, setWarnings] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([])
  const [noAssignmentsMessage, setNoAssignmentsMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ScheduleSlotInput>({
    resolver: zodResolver(scheduleSlotSchema),
  })

  const watchedClassroomId = watch("classroomId")
  const watchedSubjectId = watch("subjectId")

  useEffect(() => {
    async function loadData() {
      const [classroomsResult, roomsResult] = await Promise.all([
        listClassrooms(),
        listRooms(),
      ])

      if (classroomsResult.success) setClassrooms(classroomsResult.data)
      if (roomsResult.success) setRooms(roomsResult.data)
    }
    loadData()
  }, [])

  // Load teacher-subject assignments when classroom is selected
  useEffect(() => {
    async function loadTeacherSubjects() {
      if (!watchedClassroomId) {
        setTeacherSubjects([])
        setNoAssignmentsMessage(null)
        return
      }

      const result = await listTeacherSubjectsByClassroom(watchedClassroomId)
      
      if (result.success) {
        if (result.data.length === 0) {
          setTeacherSubjects([])
          setNoAssignmentsMessage("Aucun enseignant n'est assigné à cette classe. Veuillez d'abord créer des assignations depuis la fiche enseignant.")
        } else {
          setTeacherSubjects(result.data)
          setNoAssignmentsMessage(null)
        }
      } else {
        setTeacherSubjects([])
        setNoAssignmentsMessage(null)
      }
    }
    loadTeacherSubjects()
  }, [watchedClassroomId])

  // Reset subject and teacher when classroom changes
  useEffect(() => {
    if (watchedClassroomId) {
      setValue("subjectId", "")
      setValue("teacherId", "")
    }
  }, [watchedClassroomId, setValue])

  // Reset teacher when subject changes
  useEffect(() => {
    if (watchedSubjectId) {
      setValue("teacherId", "")
    }
  }, [watchedSubjectId, setValue])

  const isEPS = watchedSubjectId && teacherSubjects.find(ts => ts.subject.id === watchedSubjectId)?.subject.name === "EPS"

  const onSubmit = async (data: ScheduleSlotInput) => {
    setIsSubmitting(true)
    setWarnings([])
    setSuccess(false)

    const result = await createScheduleSlot(data)

    if (result.success) {
      setSuccess(true)
      if (result.warnings) {
        setWarnings(result.warnings)
      }
      // Reset form but keep classroomId for convenience
      const currentClassroomId = data.classroomId
      reset({
        classroomId: currentClassroomId,
        subjectId: "",
        teacherId: "",
        day: "MONDAY",
        startTime: "",
        endTime: "",
        roomId: "",
      })
    } else {
      alert(result.error)
    }

    setIsSubmitting(false)
  }

  const getDisplayName = (classroom: any) => {
    return `${classroom.schoolGrade.name} ${classroom.section} (${classroom.schoolYear})`
  }

  // Get unique subjects from teacher-subject assignments for the selected classroom
  const availableSubjects = Array.from(
    new Map(teacherSubjects.map(ts => [ts.subject.id, ts.subject])).values()
  )

  // Get teachers for the selected subject in the selected classroom
  const availableTeachers = watchedSubjectId
    ? teacherSubjects
        .filter(ts => ts.subject.id === watchedSubjectId)
        .map(ts => ts.teacher)
    : []

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Créer un créneau d'emploi du temps</h1>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">Créneau créé avec succès</p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 font-medium mb-2">Attention :</p>
          <ul className="text-yellow-800 text-sm list-disc list-inside">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Classe</label>
          <select
            {...register("classroomId")}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Sélectionner une classe</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {getDisplayName(classroom)}
              </option>
            ))}
          </select>
          {errors.classroomId && <p className="text-red-600 text-sm mt-1">{errors.classroomId.message}</p>}
        </div>

        {noAssignmentsMessage && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded">
            <p className="text-orange-800 text-sm">{noAssignmentsMessage}</p>
          </div>
        )}

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
                {teacher.firstName} {teacher.lastName}
              </option>
            ))}
          </select>
          {errors.teacherId && <p className="text-red-600 text-sm mt-1">{errors.teacherId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Jour</label>
          <select
            {...register("day")}
            className="w-full border rounded px-3 py-2"
          >
            <option value="MONDAY">Lundi</option>
            <option value="TUESDAY">Mardi</option>
            <option value="WEDNESDAY">Mercredi</option>
            <option value="THURSDAY">Jeudi</option>
            <option value="FRIDAY">Vendredi</option>
            <option value="SATURDAY">Samedi</option>
          </select>
          {errors.day && <p className="text-red-600 text-sm mt-1">{errors.day.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Heure de début</label>
            <input
              type="time"
              {...register("startTime")}
              className="w-full border rounded px-3 py-2"
            />
            {errors.startTime && <p className="text-red-600 text-sm mt-1">{errors.startTime.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Heure de fin</label>
            <input
              type="time"
              {...register("endTime")}
              className="w-full border rounded px-3 py-2"
            />
            {errors.endTime && <p className="text-red-600 text-sm mt-1">{errors.endTime.message}</p>}
          </div>
        </div>

        {!isEPS && (
          <div>
            <label className="block text-sm font-medium mb-1">Salle</label>
            <select
              {...register("roomId")}
              className="w-full border rounded px-3 py-2"
            >
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

        <Button type="submit" disabled={isSubmitting || !watchedClassroomId || teacherSubjects.length === 0}>
          {isSubmitting ? "Création..." : "Créer le créneau"}
        </Button>
      </form>
    </div>
  )
}
