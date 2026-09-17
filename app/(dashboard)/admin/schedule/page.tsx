"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { listClassrooms } from "@/lib/actions/classroom"
import { listTeachers } from "@/lib/actions/teacher"
import { listRooms } from "@/lib/actions/room"
import { getSchoolScheduleSettings, type ScheduleSettings } from "@/lib/actions/school"
import { listScheduleSlotsByClassroom, listScheduleSlotsByTeacher, listScheduleSlotsByRoom, deleteScheduleSlot } from "@/lib/actions/schedule-slot"
import { ScheduleView } from "@/components/ScheduleView"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { EditScheduleSlotDialog } from "@/components/EditScheduleSlotDialog"
import { ToastContainer } from "@/components/Toast"
import { useToast } from "@/lib/hooks/useToast"
import type { ScheduleSlotWithRelations } from "@/lib/actions/schedule-slot"

// Use const enum for better type safety and performance
const FilterMode = {
  CLASSROOM: "classroom" as const,
  TEACHER: "teacher" as const,
  ROOM: "room" as const,
} as const

type FilterMode = typeof FilterMode[keyof typeof FilterMode]

type ClassroomOption = {
  id: string
  schoolGrade: { name: string }
  section: string
  schoolYear: string
}

type TeacherOption = {
  id: string
  firstName: string | null
  lastName: string
}

type RoomOption = {
  id: string
  name: string
}

export default function AdminSchedulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toasts, addToast, removeToast, success, error: showError } = useToast()
  
  // Initialize from URL parameters
  const initialMode = (searchParams.get("mode") as FilterMode) || FilterMode.CLASSROOM
  const initialSelectedId = searchParams.get("selectedId") || ""
  
  const [mode, setMode] = useState<FilterMode>(initialMode)
  const [selectedId, setSelectedId] = useState<string>(initialSelectedId)
  const [slots, setSlots] = useState<ScheduleSlotWithRelations[]>([])
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [rooms, setRooms] = useState<RoomOption[]>([])
  const [slotToDelete, setSlotToDelete] = useState<ScheduleSlotWithRelations | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [slotToEdit, setSlotToEdit] = useState<ScheduleSlotWithRelations | null>(null)

  useEffect(() => {
    async function loadData() {
      const [classroomsResult, teachersResult, roomsResult, settingsResult] = await Promise.all([
        listClassrooms({ page: 1, pageSize: 1000 }),
        listTeachers({ page: 1, pageSize: 1000 }),
        listRooms({ page: 1, pageSize: 1000 }),
        getSchoolScheduleSettings(),
      ])
      
      if (classroomsResult.success) setClassrooms(classroomsResult.data)
      if (teachersResult.success) setTeachers(teachersResult.data)
      if (roomsResult.success) setRooms(roomsResult.data)
      if (settingsResult.success) setScheduleSettings(settingsResult.data)
    }
    loadData()
  }, [])

  const loadSlots = useCallback(async () => {
    if (!selectedId) return
    setLoading(true)
    try {
      let result
      switch (mode) {
        case FilterMode.CLASSROOM:
          result = await listScheduleSlotsByClassroom(selectedId)
          break
        case FilterMode.TEACHER:
          result = await listScheduleSlotsByTeacher(selectedId)
          break
        case FilterMode.ROOM:
          result = await listScheduleSlotsByRoom(selectedId)
          break
      }
      if (result?.success) {
        setSlots(result.data)
      } else {
        showError(result?.error || "Erreur lors du chargement des créneaux")
      }
    } catch (err) {
      showError("Erreur réseau lors du chargement des créneaux")
    } finally {
      setLoading(false)
    }
  }, [mode, selectedId, showError])

  useEffect(() => {
    void loadSlots()
  }, [loadSlots])

  const handleEdit = (slot: ScheduleSlotWithRelations) => {
    setSlotToEdit(slot)
  }

  const handleDeleteRequest = (slot: ScheduleSlotWithRelations) => {
    setSlotToDelete(slot)
  }

  const handleDeleteConfirm = async () => {
    if (!slotToDelete) return
    setIsDeleting(true)
    try {
      const result = await deleteScheduleSlot(slotToDelete.id)
      if (result.success) {
        success("Créneau supprimé avec succès")
        await loadSlots()
        setSlotToDelete(null)
      } else {
        showError(result.error || "Erreur lors de la suppression du créneau")
      }
    } catch (err) {
      showError("Erreur réseau lors de la suppression du créneau")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setSlotToDelete(null)
  }

  const handleModeChange = (newMode: FilterMode) => {
    setMode(newMode)
    setSelectedId("")
    setSlots([])
    // Update URL without full page reload
    router.push(`/admin/schedule?mode=${newMode}`)
  }

  const handleSelectedIdChange = (newId: string) => {
    setSelectedId(newId)
    // Update URL without full page reload
    router.push(`/admin/schedule?mode=${mode}&selectedId=${newId}`)
  }

  const handleEditSuccess = async () => {
    setSlotToEdit(null)
    try {
      await loadSlots()
      success("Créneau modifié avec succès")
    } catch (err) {
      showError("Erreur lors du rechargement des créneaux")
    }
  }

  const getDisplayName = (item: ClassroomOption | TeacherOption | RoomOption) => {
    switch (mode) {
      case FilterMode.CLASSROOM: {
        const classroom = item as ClassroomOption
        return `${classroom.schoolGrade.name} ${classroom.section} (${classroom.schoolYear})`
      }
      case FilterMode.TEACHER: {
        const teacher = item as TeacherOption
        return teacher.firstName ? `${teacher.firstName} ${teacher.lastName}` : teacher.lastName
      }
      case FilterMode.ROOM: {
        const room = item as RoomOption
        return room.name
      }
    }
  }

  const getModeLabel = () => {
    switch (mode) {
      case FilterMode.CLASSROOM:
        return "Classe"
      case FilterMode.TEACHER:
        return "Enseignant"
      case FilterMode.ROOM:
        return "Salle"
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Emploi du temps</h1>
        <Link
          href={`/admin/schedule/new?mode=${mode}&selectedId=${selectedId}`}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          + Nouveau créneau
        </Link>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleModeChange(FilterMode.CLASSROOM)}
            className={`px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              mode === FilterMode.CLASSROOM
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            aria-pressed={mode === FilterMode.CLASSROOM}
          >
            Classe
          </button>
          <button
            onClick={() => handleModeChange(FilterMode.TEACHER)}
            className={`px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              mode === FilterMode.TEACHER
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            aria-pressed={mode === FilterMode.TEACHER}
          >
            Enseignant
          </button>
          <button
            onClick={() => handleModeChange(FilterMode.ROOM)}
            className={`px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              mode === FilterMode.ROOM
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            aria-pressed={mode === FilterMode.ROOM}
          >
            Salle
          </button>
        </div>

        <div>
          <select
            value={selectedId}
            onChange={(e) => handleSelectedIdChange(e.target.value)}
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

      {!loading && selectedId && (
        <ScheduleView
          slots={slots}
          scheduleSettings={scheduleSettings}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      )}

      {slotToEdit && (
        <EditScheduleSlotDialog
          slot={slotToEdit}
          onSuccess={handleEditSuccess}
          onCancel={() => setSlotToEdit(null)}
        />
      )}

      {slotToDelete && (
        <ConfirmDialog
          variant="delete"
          message={`Supprimer le créneau "${slotToDelete.subject.name}" (${slotToDelete.day} ${slotToDelete.startTime}–${slotToDelete.endTime}) ?`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isLoading={isDeleting}
        />
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
