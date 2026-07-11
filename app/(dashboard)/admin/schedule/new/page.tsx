"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createScheduleSlot } from "@/lib/actions/schedule-slot"
import { listClassrooms } from "@/lib/actions/classroom"
import { listSubjects } from "@/lib/actions/subject"
import { listTeachers } from "@/lib/actions/teacher"
import { listRooms } from "@/lib/actions/room"
import { scheduleSlotSchema, type ScheduleSlotInput } from "@/lib/validations/schedule-slot"
import { Button } from "@/components/ui/button"

export default function NewScheduleSlotPage() {
  const [warning, setWarning] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ScheduleSlotInput>({
    resolver: zodResolver(scheduleSlotSchema),
  })

  useEffect(() => {
    async function loadData() {
      const [classroomsResult, subjectsResult, teachersResult, roomsResult] = await Promise.all([
        listClassrooms(),
        listSubjects(),
        listTeachers(),
        listRooms(),
      ])

      if (classroomsResult.success) setClassrooms(classroomsResult.data)
      if (subjectsResult.success) setSubjects(subjectsResult.data)
      if (teachersResult.success) setTeachers(teachersResult.data)
      if (roomsResult.success) setRooms(roomsResult.data)
    }
    loadData()
  }, [])

  const watchedSubjectId = watch("subjectId")
  useEffect(() => {
    setSelectedSubjectId(watchedSubjectId || "")
  }, [watchedSubjectId])

  const isEPS = selectedSubjectId && subjects.find(s => s.id === selectedSubjectId)?.name === "EPS"

  const onSubmit = async (data: ScheduleSlotInput) => {
    setIsSubmitting(true)
    setWarning(null)
    setSuccess(false)

    const result = await createScheduleSlot(data)

    if (result.success) {
      setSuccess(true)
      if (result.warning) {
        setWarning(result.warning)
      }
    } else {
      alert(result.error)
    }

    setIsSubmitting(false)
  }

  const getDisplayName = (classroom: any) => {
    return `${classroom.schoolGrade.name} ${classroom.section} (${classroom.schoolYear})`
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Créer un créneau d'emploi du temps</h1>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">Créneau créé avec succès</p>
        </div>
      )}

      {warning && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 font-medium">Attention : {warning}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <div>
          <label className="block text-sm font-medium mb-1">Matière</label>
          <select
            {...register("subjectId")}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Sélectionner une matière</option>
            {subjects.map((subject) => (
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
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Sélectionner un enseignant</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.firstName} {teacher.lastName}
              </option>
            ))}
          </select>
          {errors.teacherId && <p className="text-red-600 text-sm mt-1">{errors.teacherId.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Création..." : "Créer le créneau"}
        </Button>
      </form>
    </div>
  )
}
