import { describe, it, expect, beforeEach, vi } from "vitest"
import { listTeacherSubjects, assignTeacherSubject, removeTeacherSubject } from "./teacher-subject"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

describe("TeacherSubject Server Actions", () => {
  const mockSchoolId = "school-123"
  const mockTeacherId = "teacher-123"

  const mockSession = (role: any = "SCHOOL_ADMIN", schoolId: string | null = mockSchoolId) => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-123",
        email: "test@example.com",
        role,
        schoolId,
        teacherId: null,
        studentId: null,
      },
      expires: "9999-12-31T23:59:59.999Z"
    } as any)
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listTeacherSubjects", () => {
    it("should return teacher subjects filtered by schoolId", async () => {
      mockSession()
      
      const mockData = [
        { 
          id: "ts1", 
          teacher: { id: mockTeacherId, firstName: "Jean", lastName: "Rakoto" },
          subject: { id: "s1", name: "Mathématiques" },
          classroom: { 
            id: "c1", 
            section: "A", 
            schoolYear: "2025-2026",
            schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" }
          },
          schoolId: mockSchoolId,
        }
      ]
      
      vi.mocked(prisma.teacherSubject.findMany).mockResolvedValue(mockData as any)

      const result = await listTeacherSubjects(mockTeacherId)

      expect(prisma.teacherSubject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teacherId: mockTeacherId, schoolId: mockSchoolId }
        })
      )
      expect(result).toEqual({ success: true, data: mockData })
    })
  })

  describe("assignTeacherSubject", () => {
    it("should assign teacher to subject in classroom", async () => {
      mockSession("SCHOOL_ADMIN")
      
      const input = {
        teacherId: mockTeacherId,
        subjectId: "subject-1",
        classroomId: "classroom-1",
      }
      
      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: mockTeacherId,
        schoolId: mockSchoolId,
      } as any)
      
      vi.mocked(prisma.subject.findUnique).mockResolvedValue({
        id: "subject-1",
        schoolId: mockSchoolId,
      } as any)
      
      vi.mocked(prisma.classroom.findUnique).mockResolvedValue({
        id: "classroom-1",
        schoolId: mockSchoolId,
      } as any)
      
      vi.mocked(prisma.teacherSubject.findUnique).mockResolvedValue(null)
      
      vi.mocked(prisma.teacherSubject.create).mockResolvedValue({
        id: "ts1",
        teacher: { id: mockTeacherId, firstName: "Jean", lastName: "Rakoto" },
        subject: { id: "subject-1", name: "Mathématiques" },
        classroom: { 
          id: "classroom-1", 
          section: "A", 
          schoolYear: "2025-2026",
          schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" }
        },
        schoolId: mockSchoolId,
      } as any)

      const result = await assignTeacherSubject(input)

      expect(result.success).toBe(true)
      expect(prisma.teacherSubject.create).toHaveBeenCalled()
    })

    it("should return error for duplicate assignment", async () => {
      mockSession("SCHOOL_ADMIN")
      
      const input = {
        teacherId: mockTeacherId,
        subjectId: "subject-1",
        classroomId: "classroom-1",
      }
      
      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: mockTeacherId,
        schoolId: mockSchoolId,
      } as any)
      
      vi.mocked(prisma.subject.findUnique).mockResolvedValue({
        id: "subject-1",
        schoolId: mockSchoolId,
      } as any)
      
      vi.mocked(prisma.classroom.findUnique).mockResolvedValue({
        id: "classroom-1",
        schoolId: mockSchoolId,
      } as any)
      
      vi.mocked(prisma.teacherSubject.findUnique).mockResolvedValue({
        id: "ts1",
      } as any)

      const result = await assignTeacherSubject(input)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("This teacher is already assigned to this subject in this classroom")
      }
      expect(prisma.teacherSubject.create).not.toHaveBeenCalled()
    })

    it("should return error for invalid data without calling Prisma", async () => {
      mockSession("SCHOOL_ADMIN")
      
      const input = { teacherId: mockTeacherId, subjectId: "", classroomId: "classroom-1" } as any
      
      const result = await assignTeacherSubject(input)
      
      expect(result.success).toBe(false)
      expect(prisma.teacherSubject.create).not.toHaveBeenCalled()
    })

    it("should return Forbidden for unauthorized role", async () => {
      mockSession("TEACHER")
      
      const input = {
        teacherId: mockTeacherId,
        subjectId: "subject-1",
        classroomId: "classroom-1",
      }
      
      const result = await assignTeacherSubject(input)
      
      expect(result).toEqual({ success: false, error: "Forbidden" })
      expect(prisma.teacherSubject.create).not.toHaveBeenCalled()
    })
  })

  describe("removeTeacherSubject", () => {
    it("should successfully remove teacher subject", async () => {
      mockSession("SCHOOL_ADMIN")
      
      vi.mocked(prisma.teacherSubject.findUnique).mockResolvedValue({
        id: "ts1",
        schoolId: mockSchoolId,
      } as any)
      
      vi.mocked(prisma.teacherSubject.delete).mockResolvedValue({ id: "ts1" } as any)
      
      const result = await removeTeacherSubject("ts1")
      
      expect(result.success).toBe(true)
      expect(prisma.teacherSubject.delete).toHaveBeenCalledWith({
        where: { id: "ts1" }
      })
    })

    it("should return Forbidden for unauthorized role", async () => {
      mockSession("TEACHER")
      const result = await removeTeacherSubject("ts1")
      expect(result.success).toBe(false)
      expect(prisma.teacherSubject.delete).not.toHaveBeenCalled()
    })
  })
})
