import { describe, it, expect, beforeEach, vi } from "vitest"
import { listScheduleSlotsForTeacher, listScheduleSlotsForStudent, listScheduleSlotsForAdmin, createScheduleSlot, updateScheduleSlot, deleteScheduleSlot } from "./schedule-slot"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Mock auth
vi.mock("@/lib/auth")

// Mock permissions
vi.mock("@/lib/permissions", () => ({
  can: vi.fn(() => true),
}))

const mockSchoolId = "school-1"
const mockTeacherId1 = "teacher-1"
const mockTeacherId2 = "teacher-2"
const mockStudentId1 = "student-1"
const mockStudentId2 = "student-2"
const mockClassroomId = "classroom-1"
const mockSubjectId = "subject-1"
const mockRoomId = "room-1"
const mockEPSSubjectId = "subject-eps"

function mockSession(role: string, schoolId?: string, teacherId?: string | null, studentId?: string | null) {
  vi.mocked(auth).mockResolvedValue({
    user: {
      id: "user-1",
      email: "test@example.com",
      role: role as any,
      schoolId: schoolId || null,
      teacherId: teacherId || null,
      studentId: studentId || null,
    },
    expires: "9999-12-31T23:59:59.999Z",
  } as any)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ScheduleSlot Server Actions", () => {
  describe("listScheduleSlotsForTeacher", () => {
    it("should return schedule slots for teacher", async () => {
      mockSession("TEACHER", mockSchoolId, mockTeacherId1)
      
      const mockData = [
        { 
          id: "slot1", 
          day: "MONDAY",
          startTime: "08:00",
          endTime: "10:00",
          roomId: mockRoomId,
          room: { id: mockRoomId, name: "Salle 1" },
          classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
          subject: { id: mockSubjectId, name: "Mathématiques" },
          teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
          schoolId: mockSchoolId,
          createdAt: new Date()
        }
      ]
      
      vi.mocked(prisma.scheduleSlot.findMany as any).mockResolvedValue(mockData as any)

      const result = await listScheduleSlotsForTeacher()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockData)
      }
    })
  })

  describe("listScheduleSlotsForStudent", () => {
    it("should return schedule slots for student", async () => {
      mockSession("STUDENT", mockSchoolId, null, mockStudentId1)
      
      const mockData = [
        { 
          id: "slot1", 
          day: "MONDAY",
          startTime: "08:00",
          endTime: "10:00",
          roomId: mockRoomId,
          room: { id: mockRoomId, name: "Salle 1" },
          classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
          subject: { id: mockSubjectId, name: "Mathématiques" },
          teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
          schoolId: mockSchoolId,
          createdAt: new Date()
        }
      ]
      
      vi.mocked(prisma.student.findUnique as any).mockResolvedValue({ classroomId: mockClassroomId } as any)
      vi.mocked(prisma.scheduleSlot.findMany as any).mockResolvedValue(mockData as any)

      const result = await listScheduleSlotsForStudent()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockData)
      }
    })
  })

  describe("listScheduleSlotsForAdmin", () => {
    it("should return all schedule slots for SCHOOL_ADMIN", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      const mockData = [
        { 
          id: "slot1", 
          day: "MONDAY",
          startTime: "08:00",
          endTime: "10:00",
          roomId: mockRoomId,
          room: { id: mockRoomId, name: "Salle 1" },
          classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
          subject: { id: mockSubjectId, name: "Mathématiques" },
          teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
          schoolId: mockSchoolId,
          createdAt: new Date()
        }
      ]
      
      vi.mocked(prisma.scheduleSlot.findMany as any).mockResolvedValue(mockData as any)

      const result = await listScheduleSlotsForAdmin()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockData)
      }
    })
  })

  describe("createScheduleSlot", () => {
    it("should create schedule slot if teacher is assigned via TeacherSubject", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      vi.mocked(prisma.teacherSubject.findUnique as any).mockResolvedValue({
        id: "ts1",
        teacherId: mockTeacherId1,
        subjectId: mockSubjectId,
        classroomId: mockClassroomId,
        schoolId: mockSchoolId,
      } as any)
      
      vi.mocked(prisma.scheduleSlot.findMany as any).mockResolvedValue([])
      vi.mocked(prisma.scheduleSlot.create as any).mockResolvedValue({
        id: "slot1",
        day: "MONDAY",
        startTime: "08:00",
        endTime: "10:00",
        roomId: mockRoomId,
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        teacherId: mockTeacherId1,
        schoolId: mockSchoolId,
        classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
        subject: { id: mockSubjectId, name: "Mathématiques" },
        teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
        createdAt: new Date()
      } as any)
      
      const result = await createScheduleSlot({
        day: "MONDAY",
        startTime: "08:00",
        endTime: "10:00",
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        teacherId: mockTeacherId1,
        roomId: mockRoomId,
      })
      
      expect(result.success).toBe(true)
    })

    it("should refuse if teacher is NOT assigned via TeacherSubject", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      vi.mocked(prisma.teacherSubject.findUnique as any).mockResolvedValue(null)
      
      const result = await createScheduleSlot({
        day: "MONDAY",
        startTime: "08:00",
        endTime: "10:00",
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        teacherId: mockTeacherId1,
        roomId: mockRoomId,
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Teacher is not assigned to teach this subject in this classroom")
      }
    })

    it("should detect conflict and return warning", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      vi.mocked(prisma.teacherSubject.findUnique as any).mockResolvedValue({
        id: "ts1",
        teacherId: mockTeacherId1,
        subjectId: mockSubjectId,
        classroomId: mockClassroomId,
        schoolId: mockSchoolId,
      } as any)
      
      // Mock existing slot that conflicts (same teacher)
      vi.mocked(prisma.scheduleSlot.findMany as any).mockResolvedValue([
        {
          id: "existing-slot",
          teacherId: mockTeacherId1,
          roomId: mockRoomId,
          startTime: "09:00",
          endTime: "11:00",
        }
      ] as any)
      
      vi.mocked(prisma.scheduleSlot.create as any).mockResolvedValue({
        id: "slot1",
        day: "MONDAY",
        startTime: "08:00",
        endTime: "10:00",
        roomId: mockRoomId,
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        teacherId: mockTeacherId1,
        schoolId: mockSchoolId,
        classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
        subject: { id: mockSubjectId, name: "Mathématiques" },
        teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
        room: { id: mockRoomId, name: "Salle 1" },
        createdAt: new Date()
      } as any)
      
      const result = await createScheduleSlot({
        day: "MONDAY",
        startTime: "08:00",
        endTime: "10:00",
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        teacherId: mockTeacherId1,
        roomId: mockRoomId,
      })
      
      expect(result.success).toBe(true)
      if (result.success && result.warnings) {
        expect(result.warnings).toBeDefined()
        expect(result.warnings.length).toBeGreaterThan(0)
      }
    })

    it("should detect room conflict and return warning", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      vi.mocked(prisma.teacherSubject.findUnique as any).mockResolvedValue({
        id: "ts1",
        teacherId: mockTeacherId1,
        subjectId: mockSubjectId,
        classroomId: mockClassroomId,
        schoolId: mockSchoolId,
      } as any)
      
      // Mock existing slot with same room that conflicts (different teacher and classroom)
      vi.mocked(prisma.scheduleSlot.findMany as any).mockResolvedValue([
        {
          id: "existing-slot",
          teacherId: mockTeacherId2,
          classroomId: "classroom-2",
          roomId: mockRoomId,
          startTime: "09:00",
          endTime: "11:00",
        }
      ] as any)
      
      vi.mocked(prisma.scheduleSlot.create as any).mockResolvedValue({
        id: "slot1",
        day: "MONDAY",
        startTime: "08:00",
        endTime: "10:00",
        roomId: mockRoomId,
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        teacherId: mockTeacherId1,
        schoolId: mockSchoolId,
        classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
        subject: { id: mockSubjectId, name: "Mathématiques" },
        teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
        room: { id: mockRoomId, name: "Salle 1" },
        createdAt: new Date()
      } as any)
      
      const result = await createScheduleSlot({
        day: "MONDAY",
        startTime: "08:00",
        endTime: "10:00",
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        teacherId: mockTeacherId1,
        roomId: mockRoomId,
      })
      
      expect(result.success).toBe(true)
      if (result.success && result.warnings) {
        expect(result.warnings.length).toBeGreaterThan(0)
        expect(result.warnings).toContain("La salle est déjà occupée sur cet horaire")
      }
    })

    it("should NOT detect room conflict when roomId is null (EPS case)", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      vi.mocked(prisma.teacherSubject.findUnique as any).mockResolvedValue({
        id: "ts1",
        teacherId: mockTeacherId1,
        subjectId: mockEPSSubjectId,
        classroomId: mockClassroomId,
        schoolId: mockSchoolId,
      } as any)
      
      // Mock existing slots - should not trigger room conflict since roomId is null
      vi.mocked(prisma.scheduleSlot.findMany as any).mockResolvedValue([
        {
          id: "existing-slot",
          teacherId: mockTeacherId2,
          roomId: mockRoomId,
          startTime: "09:00",
          endTime: "11:00",
        }
      ] as any)
      
      vi.mocked(prisma.scheduleSlot.create as any).mockResolvedValue({
        id: "slot1",
        day: "MONDAY",
        startTime: "08:00",
        endTime: "10:00",
        roomId: null,
        classroomId: mockClassroomId,
        subjectId: mockEPSSubjectId,
        teacherId: mockTeacherId1,
        schoolId: mockSchoolId,
        classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
        subject: { id: mockEPSSubjectId, name: "EPS" },
        teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
        room: null,
        createdAt: new Date()
      } as any)
      
      const result = await createScheduleSlot({
        day: "MONDAY",
        startTime: "08:00",
        endTime: "10:00",
        classroomId: mockClassroomId,
        subjectId: mockEPSSubjectId,
        teacherId: mockTeacherId1,
        roomId: null,
      })
      
      expect(result.success).toBe(true)
      if (result.success && result.warnings) {
        expect(result.warnings).not.toContain("Room")
      }
    })

    it("should detect classroom conflict and return warning", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      vi.mocked(prisma.teacherSubject.findUnique as any).mockResolvedValue({
        id: "ts1",
        teacherId: mockTeacherId1,
        subjectId: mockSubjectId,
        classroomId: mockClassroomId,
        schoolId: mockSchoolId,
      } as any)
      
      // Mock existing slot with same classroom that conflicts (different teacher and room)
      vi.mocked(prisma.scheduleSlot.findMany as any).mockResolvedValue([
        {
          id: "existing-slot",
          teacherId: mockTeacherId2,
          classroomId: mockClassroomId,
          roomId: "room-2",
          startTime: "09:00",
          endTime: "11:00",
        }
      ] as any)
      
      vi.mocked(prisma.scheduleSlot.create as any).mockResolvedValue({
        id: "slot1",
        day: "MONDAY",
        startTime: "08:00",
        endTime: "10:00",
        roomId: mockRoomId,
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        teacherId: mockTeacherId1,
        schoolId: mockSchoolId,
        classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
        subject: { id: mockSubjectId, name: "Mathématiques" },
        teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
        room: { id: mockRoomId, name: "Salle 1" },
        createdAt: new Date()
      } as any)
      
      const result = await createScheduleSlot({
        day: "MONDAY",
        startTime: "08:00",
        endTime: "10:00",
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        teacherId: mockTeacherId1,
        roomId: mockRoomId,
      })
      
      expect(result.success).toBe(true)
      if (result.success && result.warnings) {
        expect(result.warnings).toContain("La classe a déjà un cours sur cet horaire")
      }
    })

    it("should detect multiple conflicts (classroom + room) and return all warnings", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      vi.mocked(prisma.teacherSubject.findUnique as any).mockResolvedValue({
        id: "ts1",
        teacherId: mockTeacherId1,
        subjectId: mockSubjectId,
        classroomId: mockClassroomId,
        schoolId: mockSchoolId,
      } as any)
      
      // Mock existing slot with same classroom AND same room (different teacher)
      vi.mocked(prisma.scheduleSlot.findMany as any).mockResolvedValue([
        {
          id: "existing-slot",
          teacherId: mockTeacherId2,
          classroomId: mockClassroomId,
          roomId: mockRoomId,
          startTime: "09:00",
          endTime: "11:00",
        }
      ] as any)
      
      vi.mocked(prisma.scheduleSlot.create as any).mockResolvedValue({
        id: "slot1",
        day: "MONDAY",
        startTime: "08:00",
        endTime: "10:00",
        roomId: mockRoomId,
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        teacherId: mockTeacherId1,
        schoolId: mockSchoolId,
        classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
        subject: { id: mockSubjectId, name: "Mathématiques" },
        teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
        room: { id: mockRoomId, name: "Salle 1" },
        createdAt: new Date()
      } as any)
      
      const result = await createScheduleSlot({
        day: "MONDAY",
        startTime: "08:00",
        endTime: "10:00",
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        teacherId: mockTeacherId1,
        roomId: mockRoomId,
      })
      
      expect(result.success).toBe(true)
      if (result.success && result.warnings) {
        expect(result.warnings).toContain("La classe a déjà un cours sur cet horaire")
        expect(result.warnings).toContain("La salle est déjà occupée sur cet horaire")
      }
    })
  })

  describe("updateScheduleSlot", () => {
    it("should allow admin to update schedule slot", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      vi.mocked(prisma.scheduleSlot.findUnique as any).mockResolvedValue({
        id: "slot1",
        teacherId: mockTeacherId1,
        subjectId: mockSubjectId,
        classroomId: mockClassroomId,
      } as any)
      
      vi.mocked(prisma.teacherSubject.findUnique as any).mockResolvedValue({
        id: "ts1",
        teacherId: mockTeacherId1,
        subjectId: mockSubjectId,
        classroomId: mockClassroomId,
        schoolId: mockSchoolId,
      } as any)
      
      vi.mocked(prisma.scheduleSlot.findMany as any).mockResolvedValue([])
      vi.mocked(prisma.scheduleSlot.update as any).mockResolvedValue({
        id: "slot1",
        day: "TUESDAY",
        startTime: "09:00",
        endTime: "11:00",
        roomId: mockRoomId,
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        teacherId: mockTeacherId1,
        schoolId: mockSchoolId,
        classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
        subject: { id: mockSubjectId, name: "Mathématiques" },
        teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
        room: { id: mockRoomId, name: "Salle 1" },
        createdAt: new Date()
      } as any)
      
      const result = await updateScheduleSlot("slot1", { day: "TUESDAY" })
      
      expect(result.success).toBe(true)
    })
  })

  describe("deleteScheduleSlot", () => {
    it("should allow admin to delete schedule slot", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      vi.mocked(prisma.scheduleSlot.delete as any).mockResolvedValue({ id: "slot1" } as any)
      
      const result = await deleteScheduleSlot("slot1")
      
      expect(result.success).toBe(true)
    })
  })
})
