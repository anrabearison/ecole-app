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

  const rawGradeMock = {
    id: "g1",
    value: 14,
    comment: null,
    createdAt: new Date(),
    student: { id: mockStudentId1, firstName: "Jean", lastName: "Rakoto" },
    assessment: {
      id: "a1",
      date: new Date(),
      type: "DAILY",
      title: null,
      periodId: mockPeriodId,
      schoolId: mockSchoolId,
      subject: { id: mockSubjectId, name: "Mathématiques" },
      teacher: { id: mockTeacherId1, firstName: "Prof1", lastName: "Test" },
      classroom: { id: mockClassroomId, section: "A", schoolYear: "2025-2026", schoolGrade: { id: "sg1", name: "6ème", cycle: "MIDDLE_SCHOOL" } },
      period: { id: mockPeriodId, name: "Trimestre 1" },
    },
  }

  const expectedGradeWithRelations = {
    id: "g1",
    value: 14,
    comment: null,
    type: "DAILY",
    date: rawGradeMock.assessment.date,
    student: rawGradeMock.student,
    subject: rawGradeMock.assessment.subject,
    teacher: rawGradeMock.assessment.teacher,
    classroom: rawGradeMock.assessment.classroom,
    period: rawGradeMock.assessment.period,
    assessment: {
      id: "a1",
      date: rawGradeMock.assessment.date,
      type: "DAILY",
      title: null,
      periodId: mockPeriodId,
      period: rawGradeMock.assessment.period,
    },
    schoolId: mockSchoolId,
    createdAt: rawGradeMock.createdAt,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listGradesForTeacher", () => {
    it("should return grades for teacher", async () => {
      mockSession("TEACHER", mockSchoolId, mockTeacherId1)
      
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue([rawGradeMock] as any)
      vi.mocked(prisma.grade.count).mockResolvedValue(1)

      const result = await listGradesForTeacher()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual([expectedGradeWithRelations])
      }
    })
  })

  describe("listGradesForStudent", () => {
    it("should return grades for student", async () => {
      mockSession("STUDENT", mockSchoolId, null, mockStudentId1)
      
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue([rawGradeMock] as any)
      vi.mocked(prisma.grade.count).mockResolvedValue(1)

      const result = await listGradesForStudent()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual([expectedGradeWithRelations])
      }
    })
  })

  describe("listGradesForAdmin", () => {
    it("should pass additional filters to Prisma", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.grade.findMany as any).mockResolvedValue([] as any)
      vi.mocked(prisma.grade.count).mockResolvedValue(0)

      await listGradesForAdmin({
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        teacherId: mockTeacherId1,
        studentId: mockStudentId1,
        periodId: mockPeriodId,
        type: "EXAM",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      } as any)

      expect(vi.mocked(prisma.grade.findMany as any)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            studentId: mockStudentId1,
            assessment: expect.objectContaining({
              schoolId: mockSchoolId,
              classroomId: mockClassroomId,
              subjectId: mockSubjectId,
              teacherId: mockTeacherId1,
              periodId: mockPeriodId,
              type: "EXAM",
              date: expect.objectContaining({
                gte: expect.any(Date),
                lte: expect.any(Date),
              }),
            }),
          }),
        })
      )
    })

    it("should return all grades for SCHOOL_ADMIN", async () => {
      mockSession("SCHOOL_ADMIN")
      
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue([rawGradeMock] as any)
      vi.mocked(prisma.grade.count).mockResolvedValue(1)

      const result = await listGradesForAdmin()

      expect(result).toEqual(expect.objectContaining({ success: true, data: [expectedGradeWithRelations] }))
    })

    it("should return all grades for STAFF_ADMIN", async () => {
      mockSession("STAFF_ADMIN")
      
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue([rawGradeMock] as any)
      vi.mocked(prisma.grade.count).mockResolvedValue(1)

      const result = await listGradesForAdmin()

      expect(result).toEqual(expect.objectContaining({ success: true, data: [expectedGradeWithRelations] }))
    })
  })

  describe("createGrades", () => {
    it("should create grades if teacher is assigned to subject+class via TeacherSubject (CRITICAL SECURITY TEST)", async () => {
      mockSession("TEACHER", mockSchoolId, mockTeacherId1)
      
      vi.mocked(prisma.teacherSubject.findUnique as any).mockResolvedValue({
        id: "ts1",
        teacherId: mockTeacherId1,
        subjectId: mockSubjectId,
        classroomId: mockClassroomId,
        schoolId: mockSchoolId,
      } as any)
      
      vi.mocked(prisma.assessment.create as any).mockResolvedValue({
        id: "a1",
        date: new Date(),
        type: "DAILY",
        title: null,
        periodId: mockPeriodId,
        classroomId: mockClassroomId,
        subjectId: mockSubjectId,
        teacherId: mockTeacherId1,
        schoolId: mockSchoolId,
      })
      vi.mocked(prisma.grade.createMany as any).mockResolvedValue({ count: 1 })
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue([rawGradeMock])

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
        assessmentId: "a1",
        assessment: { teacherId: mockTeacherId1, schoolId: mockSchoolId },
      } as any)
      
      vi.mocked(prisma.grade.update as any).mockResolvedValue({
        ...rawGradeMock,
        value: 15,
      } as any)
      
      const result = await updateGrade("g1", { value: 15 })
      
      expect(result.success).toBe(true)
    })

    it("should refuse if grade belongs to another teacher (CRITICAL SECURITY TEST)", async () => {
      mockSession("TEACHER", mockSchoolId, mockTeacherId1)
      
      vi.mocked(prisma.grade.findUnique as any).mockResolvedValue({
        id: "g1",
        assessmentId: "a1",
        assessment: { teacherId: mockTeacherId2, schoolId: mockSchoolId },
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
        assessmentId: "a1",
        assessment: { teacherId: mockTeacherId1, schoolId: mockSchoolId },
      } as any)
      
      vi.mocked(prisma.grade.delete as any).mockResolvedValue({ id: "g1" } as any)
      
      const result = await deleteGrade("g1")
      
      expect(result.success).toBe(true)
    })

    it("should refuse if grade belongs to another teacher (CRITICAL SECURITY TEST)", async () => {
      mockSession("TEACHER", mockSchoolId, mockTeacherId1)
      
      vi.mocked(prisma.grade.findUnique as any).mockResolvedValue({
        id: "g1",
        assessmentId: "a1",
        assessment: { teacherId: mockTeacherId2, schoolId: mockSchoolId },
      } as any)
      
      const result = await deleteGrade("g1")
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("You can only delete grades you have entered")
      }
      expect(vi.mocked(prisma.grade.delete as any)).not.toHaveBeenCalled()
    })
  })

  describe("listAssessmentDates", () => {
    it("should return formatted distinct assessment dates", async () => {
      mockSession("TEACHER", mockSchoolId, mockTeacherId1)

      vi.mocked(prisma.assessment.findMany as any).mockResolvedValue([
        { date: new Date("2026-09-08T10:00:00Z"), title: "Interro 1", type: "DAILY" },
      ] as any)

      const { listAssessmentDates } = await import("./grade")
      const result = await listAssessmentDates({ classroomId: mockClassroomId })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0].date).toBe("2026-09-08")
      }
    })
  })
})
