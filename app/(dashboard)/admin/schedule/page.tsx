"use client"

import { useState, useEffect } from "react"
import { listClassrooms } from "@/lib/actions/classroom"
import { listTeachers } from "@/lib/actions/teacher"
import { listRooms } from "@/lib/actions/room"
import { listScheduleSlotsByClassroom, listScheduleSlotsByTeacher, listScheduleSlotsByRoom } from "@/lib/actions/schedule-slot"
import { ScheduleView } from "@/components/ScheduleView"
import type { ScheduleSlotWithRelations } from "@/lib/actions/schedule-slot"

type FilterMode = "classroom" | "teacher" | "room"

type ClassroomOption = {
  id: string
  schoolGrade: { name: string }
  section: string
  schoolYear: string
}

type TeacherOption = {
  id: string
  firstName: string
  lastName: string
}

type RoomOption = {
  id: string
  name: string
}

export default function AdminSchedulePage() {
  const [mode, setMode] = useState<FilterMode>("classroom")
  const [selectedId, setSelectedId] = useState<string>("")
  const [slots, setSlots] = useState<ScheduleSlotWithRelations[]>([])
  const [loading, setLoading] = useState(false)
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [rooms, setRooms] = useState<RoomOption[]>([])

  useEffect(() => {
    async function loadData() {
      const [classroomsResult, teachersResult, roomsResult] = await Promise.all([
        listClassrooms(),
        listTeachers(),
        listRooms(),
      ])
      
      if (classroomsResult.success) setClassrooms(classroomsResult.data)
      if (teachersResult.success) setTeachers(teachersResult.data)
      if (roomsResult.success) setRooms(roomsResult.data)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      return
    }

    let isActive = true

    async function loadSlots() {
      setLoading(true)
      let result

      switch (mode) {
        case "classroom":
          result = await listScheduleSlotsByClassroom(selectedId)
          break
        case "teacher":
          result = await listScheduleSlotsByTeacher(selectedId)
          break
        case "room":
          result = await listScheduleSlotsByRoom(selectedId)
          break
      }

      if (!isActive) {
        return
      }

      if (result?.success) {
        setSlots(result.data)
      }
      setLoading(false)
    }

    void loadSlots()

    return () => {
      isActive = false
    }
  }, [mode, selectedId])

  const handleModeChange = (newMode: FilterMode) => {
    setMode(newMode)
    setSelectedId("")
    setSlots([])
  }

  const getDisplayName = (item: ClassroomOption | TeacherOption | RoomOption) => {
    switch (mode) {
      case "classroom": {
        const classroom = item as ClassroomOption
        return `${classroom.schoolGrade.name} ${classroom.section} (${classroom.schoolYear})`
      }
      case "teacher": {
        const teacher = item as TeacherOption
        return `${teacher.firstName} ${teacher.lastName}`
      }
      case "room": {
        const room = item as RoomOption
        return room.name
      }
    }
  }

  const getModeLabel = () => {
    switch (mode) {
      case "classroom":
        return "Classe"
      case "teacher":
        return "Enseignant"
      case "room":
        return "Salle"
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Emploi du temps</h1>

      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleModeChange("classroom")}
            className={`px-4 py-2 rounded font-medium ${
              mode === "classroom"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Classe
          </button>
          <button
            onClick={() => handleModeChange("teacher")}
            className={`px-4 py-2 rounded font-medium ${
              mode === "teacher"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Enseignant
          </button>
          <button
            onClick={() => handleModeChange("room")}
            className={`px-4 py-2 rounded font-medium ${
              mode === "room"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Salle
          </button>
        </div>

        <div>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full max-w-md border rounded px-3 py-2"
          >
            <option value="">Sélectionner {getModeLabel().toLowerCase()}</option>
            {(mode === "classroom" ? classrooms : mode === "teacher" ? teachers : rooms).map((item) => (
              <option key={item.id} value={item.id}>
                {getDisplayName(item)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-600">Chargement...</div>
      )}

      {!loading && !selectedId && (
        <div className="text-center py-8 text-gray-600">
          Sélectionnez une classe, un enseignant ou une salle pour afficher son emploi du temps
        </div>
      )}

      {!loading && selectedId && slots.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          Aucun créneau trouvé pour cette sélection
        </div>
      )}

      {!loading && selectedId && slots.length > 0 && (
        <ScheduleView slots={slots} />
      )}
    </div>
  )
}
