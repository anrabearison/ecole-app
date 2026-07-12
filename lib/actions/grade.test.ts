import { describe, it, expect, beforeEach, vi } from "vitest"
import { listGradesForTeacher, listGradesForStudent, listGradesForAdmin, createGrades, updateGrade, deleteGrade } from "./grade"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

describe("Grade Server Actions", () => {
  const mockSchoolId = "school-123"
  const mockTeacherId1 = "teacher-1"
  const mockTeacherId2 = "teacher-2"
  const mockStudentId1 = "student-1"
  const mockStudentId2 = "student-2"
  const mockClassroomId = "classroom-1"
  const mockSubjectId = "subject-1"
  const mockPeriodId = "period-1"

  const mockSession = (role: any = "SCHOOL_ADMIN", schoolId: string | null = mockSchoolId, teacherId: string | null = null, studentId: string | null = null) => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-123",
        email: "test@example.com",
        role,
        schoolId,
        teacherId,
        studentId,
      },
      expires: "9999-12-31T23:59:59.999Z"
    } as any)
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listGradesForTeacher", () => {
    it("should return grades for teacher", async () => {
      mockSession("TEACHER", mockSchoolId, mockTeacherId1)
      
      const mockData = [
        { 
          id: "g1", 
          value: 14,
          type: "DAILY",
          date: new Date(),
          comment: null,
          student: { id: mockStudentId1, firstName: "Jean", lastName: "Rakoto" },
          subject: { id: mockSubjectId, name: "Mathématiques" },
          teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
          classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
          schoolId: mockSchoolId,
          createdAt: new Date()
        }
      ]
      
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue(mockData as any)

      const result = await listGradesForTeacher()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockData)
      }
    })
  })

  describe("listGradesForStudent", () => {
    it("should return grades for student", async () => {
      mockSession("STUDENT", mockSchoolId, null, mockStudentId1)
      
      const mockData = [
        { 
          id: "g1", 
          value: 14,
          type: "DAILY",
          date: new Date(),
          comment: null,
          student: { id: mockStudentId1, firstName: "Jean", lastName: "Rakoto" },
          subject: { id: mockSubjectId, name: "Mathématiques" },
          teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
          classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
          schoolId: mockSchoolId,
          createdAt: new Date()
        }
      ]
      
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue(mockData as any)

      const result = await listGradesForStudent()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockData)
      }
    })
  })

  describe("listGradesForAdmin", () => {
    it("should return all grades for SCHOOL_ADMIN", async () => {
      mockSession("SCHOOL_ADMIN")
      
      const mockData = [
        { 
          id: "g1", 
          value: 14,
          type: "DAILY",
          date: new Date(),
          comment: null,
          student: { id: mockStudentId1, firstName: "Jean", lastName: "Rakoto" },
          subject: { id: mockSubjectId, name: "Mathématiques" },
          teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
          classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
          schoolId: mockSchoolId,
          createdAt: new Date()
        }
      ]
      
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue(mockData as any)

      const result = await listGradesForAdmin()

      expect(vi.mocked(prisma.grade.findMany as any)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: mockSchoolId }
        })
      )
      expect(result).toEqual({ success: true, data: mockData })
    })

    it("should return all grades for STAFF_ADMIN", async () => {
      mockSession("STAFF_ADMIN")
      
      const mockData = [
        { 
          id: "g1", 
          value: 14,
          type: "DAILY",
          date: new Date(),
          comment: null,
          student: { id: mockStudentId1, firstName: "Jean", lastName: "Rakoto" },
          subject: { id: mockSubjectId, name: "Mathématiques" },
          teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
          classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
          schoolId: mockSchoolId,
          createdAt: new Date()
        }
      ]
      
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue(mockData as any)

      const result = await listGradesForAdmin()

      expect(vi.mocked(prisma.grade.findMany as any)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: mockSchoolId }
        })
      )
      expect(result).toEqual({ success: true, data: mockData })
    })
  })

  describe("createGrades", () => {
    it("should create grades if teacher is assigned to subject+class via TeacherSubject (CRITICAL SECURITY TEST)", async () => {
      mockSession("TEACHER", mockSchoolId, mockTeacherId1)
      
      // Mock that teacher IS assigned to this subject+class
      vi.mocked(prisma.teacherSubject.findUnique as any).mockResolvedValue({
        id: "ts1",
        teacherId: mockTeacherId1,
        subjectId: mockSubjectId,
        classroomId: mockClassroomId,
        schoolId: mockSchoolId,
      } as any)
      
      vi.mocked(prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          grade: {
            create: vi.fn().mockResolvedValue({
              id: "g1",
              value: 14,
              type: "DAILY",
              date: new Date(),
              comment: null,
              student: { id: mockStudentId1, firstName: "Jean", lastName: "Rakoto" },
              subject: { id: mockSubjectId, name: "Mathématiques" },
              teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
              classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
              schoolId: mockSchoolId,
              createdAt: new Date()
            }),
          },
        }
        return callback(tx)
      })
      
      const result = await createGrades({
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        periodId: mockPeriodId,
        type: "DAILY",
        date: new Date().toISOString(),
        entries: [{ studentId: mockStudentId1, value: 14 }],
      })
      
      expect(result.success).toBe(true)
      expect(prisma.teacherSubject.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            teacherId_subjectId_classroomId: {
              teacherId: mockTeacherId1,
              subjectId: mockSubjectId,
              classroomId: mockClassroomId,
            },
          },
        })
      )
    })

    it("should refuse if teacher is NOT assigned to subject+class via TeacherSubject (CRITICAL SECURITY TEST)", async () => {
      mockSession("TEACHER", mockSchoolId, mockTeacherId1)
      
      // Mock that teacher is NOT assigned to this subject+class
      vi.mocked(prisma.teacherSubject.findUnique).mockResolvedValue(null)
      
      const result = await createGrades({
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        periodId: mockPeriodId,
        type: "DAILY",
        date: new Date().toISOString(),
        entries: [{ studentId: mockStudentId1, value: 14 }],
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("You are not assigned to teach this subject in this classroom")
      }
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("should return error for invalid data without calling Prisma", async () => {
      mockSession("TEACHER", mockSchoolId, mockTeacherId1)
      
      const result = await createGrades({
        classroomId: "",
        subjectId: mockSubjectId,
        type: "DAILY",
        date: new Date().toISOString(),
        entries: [],
      } as any)
      
      expect(result.success).toBe(false)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe("updateGrade", () => {
    it("should allow teacher to update their own grade", async () => {
      mockSession("TEACHER", mockSchoolId, mockTeacherId1)
      
      vi.mocked(prisma.grade.findUnique as any).mockResolvedValue({
        id: "g1",
        teacherId: mockTeacherId1,
        schoolId: mockSchoolId,
      } as any)
      
      vi.mocked(prisma.grade.update as any).mockResolvedValue({
        id: "g1",
        value: 15,
        type: "DAILY",
        date: new Date(),
        comment: null,
        student: { id: mockStudentId1, firstName: "Jean", lastName: "Rakoto" },
        subject: { id: mockSubjectId, name: "Mathématiques" },
        teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
        classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
        schoolId: mockSchoolId,
        createdAt: new Date()
      } as any)
      
      const result = await updateGrade("g1", { value: 15 })
      
      expect(result.success).toBe(true)
    })

    it("should refuse if grade belongs to another teacher (CRITICAL SECURITY TEST)", async () => {
      mockSession("TEACHER", mockSchoolId, mockTeacherId1)
      
      // Grade belongs to teacher-2
      vi.mocked(prisma.grade.findUnique as any).mockResolvedValue({
        id: "g1",
        teacherId: mockTeacherId2, // Different teacher
        schoolId: mockSchoolId,
      } as any)
      
      const result = await updateGrade("g1", { value: 15 })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("You can only modify grades you have entered")
      }
      expect(vi.mocked(prisma.grade.update as any)).not.toHaveBeenCalled()
    })
  })

  describe("deleteGrade", () => {
    it("should allow teacher to delete their own grade", async () => {
      mockSession("TEACHER", mockSchoolId, mockTeacherId1)
      
      vi.mocked(prisma.grade.findUnique as any).mockResolvedValue({
        id: "g1",
        teacherId: mockTeacherId1,
        schoolId: mockSchoolId,
      } as any)
      
      vi.mocked(prisma.grade.delete as any).mockResolvedValue({ id: "g1" } as any)
      
      const result = await deleteGrade("g1")
      
      expect(result.success).toBe(true)
    })

    it("should refuse if grade belongs to another teacher (CRITICAL SECURITY TEST)", async () => {
      mockSession("TEACHER", mockSchoolId, mockTeacherId1)
      
      // Grade belongs to teacher-2
      vi.mocked(prisma.grade.findUnique as any).mockResolvedValue({
        id: "g1",
        teacherId: mockTeacherId2, // Different teacher
        schoolId: mockSchoolId,
      } as any)
      
      const result = await deleteGrade("g1")
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("You can only delete grades you have entered")
      }
      expect(vi.mocked(prisma.grade.delete as any)).not.toHaveBeenCalled()
    })
  })
})
