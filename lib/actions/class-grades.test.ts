import { describe, it, expect, beforeEach, vi } from "vitest"
import { getClassGrades } from "./class-grades"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Mock auth
vi.mock("@/lib/auth")

// Mock permissions
vi.mock("@/lib/permissions", () => ({
  can: vi.fn(() => true),
}))

// Mock daily grade selection
vi.mock("./daily-grade-selection", () => ({
  getSelectedDailyAssessmentIds: vi.fn().mockResolvedValue(null),
}))

// Mock average functions
vi.mock("./average", () => ({
  calculateSubjectAverage: vi.fn().mockResolvedValue({ success: true, data: 15.5 }),
  calculateGeneralAverage: vi.fn().mockResolvedValue({ success: true, data: 14.75 }),
  calculateSubjectAveragesBatch: vi.fn().mockResolvedValue({ 
    success: true, 
    data: new Map([["student-1", new Map([["subject-1", 15.5]])]]) 
  }),
  calculateGeneralAveragesBatch: vi.fn().mockResolvedValue({ 
    success: true, 
    data: new Map([["student-1", 14.75]]) 
  }),
}))

// Mock subject coefficient
vi.mock("./subject-coefficient", () => ({
  getEffectiveCoefficient: vi.fn().mockResolvedValue(1.0),
  getEffectiveCoefficientsBatch: vi.fn().mockResolvedValue(new Map([["subject-1", 1.0]])),
}))

const mockSchoolId = "school-1"
const mockClassroomId = "classroom-1"
const mockPeriodId = "period-1"

describe("class-grades actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSession = (role: string) => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-1",
        email: "test@test.com",
        role,
        schoolId: mockSchoolId,
      },
    } as any)
  }

  describe("getClassGrades", () => {
    it("should successfully get class grades with subject appreciation", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.classroom.findUnique as any).mockResolvedValue({
        id: mockClassroomId,
        schoolId: mockSchoolId,
        schoolGrade: { name: "6ème" },
        track: null,
        section: "A",
      })

      vi.mocked(prisma.period.findUnique as any).mockResolvedValue({
        id: mockPeriodId,
        schoolId: mockSchoolId,
        name: "Trimestre 1",
        schoolYear: "2025-2026",
        examWeight: 0.5,
        dailyWeight: 0.5,
      })

      vi.mocked(prisma.student.findMany as any).mockResolvedValue([
        {
          id: "student-1",
          firstName: "Jean",
          lastName: "Dupont",
          classNumber: "1",
          classroom: { schoolGradeId: "grade-1", trackId: null },
        },
      ])

      vi.mocked(prisma.assessment.findMany as any).mockImplementation((args: any) => {
        if (args.where?.type === "DAILY") {
          return Promise.resolve([
            { id: "assessment-1", subjectId: "subject-1", title: "Test 1", date: new Date() },
          ])
        }
        if (args.where?.type === "EXAM") {
          return Promise.resolve([
            { id: "assessment-2", subjectId: "subject-1", title: "Exam 1", date: new Date() },
          ])
        }
        return Promise.resolve([{ subjectId: "subject-1" }])
      })

      vi.mocked(prisma.grade.findMany as any).mockResolvedValue([
        { studentId: "student-1", assessmentId: "assessment-1", value: 15 },
        { studentId: "student-1", assessmentId: "assessment-2", value: 16 },
      ])

      vi.mocked(prisma.subject.findUnique as any).mockResolvedValue({
        id: "subject-1",
        name: "Mathématiques",
        language: "FRENCH",
      })

      vi.mocked(prisma.subject.findMany as any).mockResolvedValue([
        { id: "subject-1", name: "Mathématiques", language: "FRENCH" },
      ])

      const result = await getClassGrades(mockClassroomId, mockPeriodId)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.students).toHaveLength(1)
        expect(result.data.students[0].subjects).toHaveLength(1)
        expect(result.data.students[0].subjects[0].appreciation).toBeDefined()
        // French appreciation for average ~15.5 should be "Bien"
        expect(result.data.students[0].subjects[0].appreciation).toBe("Bien")
      }
    })

    it("should use Malagasy appreciation for Malagasy subject", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.classroom.findUnique as any).mockResolvedValue({
        id: mockClassroomId,
        schoolId: mockSchoolId,
        schoolGrade: { name: "6ème" },
        track: null,
        section: "A",
      })

      vi.mocked(prisma.period.findUnique as any).mockResolvedValue({
        id: mockPeriodId,
        schoolId: mockSchoolId,
        name: "Trimestre 1",
        schoolYear: "2025-2026",
        examWeight: 0.5,
        dailyWeight: 0.5,
      })

      vi.mocked(prisma.student.findMany as any).mockResolvedValue([
        {
          id: "student-1",
          firstName: "Jean",
          lastName: "Dupont",
          classNumber: "1",
          classroom: { schoolGradeId: "grade-1", trackId: null },
        },
      ])

      vi.mocked(prisma.assessment.findMany as any).mockImplementation((args: any) => {
        if (args.where?.type === "DAILY") {
          return Promise.resolve([
            { id: "assessment-1", subjectId: "subject-1", title: "Test 1", date: new Date() },
          ])
        }
        if (args.where?.type === "EXAM") {
          return Promise.resolve([
            { id: "assessment-2", subjectId: "subject-1", title: "Exam 1", date: new Date() },
          ])
        }
        return Promise.resolve([{ subjectId: "subject-1" }])
      })

      vi.mocked(prisma.grade.findMany as any).mockResolvedValue([
        { studentId: "student-1", assessmentId: "assessment-1", value: 15 },
        { studentId: "student-1", assessmentId: "assessment-2", value: 16 },
      ])

      vi.mocked(prisma.subject.findUnique as any).mockResolvedValue({
        id: "subject-1",
        name: "Malagasy",
        language: "MALAGASY",
      })

      vi.mocked(prisma.subject.findMany as any).mockResolvedValue([
        { id: "subject-1", name: "Malagasy", language: "MALAGASY" },
      ])

      const result = await getClassGrades(mockClassroomId, mockPeriodId)

      expect(result.success).toBe(true)
      if (result.success) {
        // Malagasy appreciation for average ~15.5 should be "Tena Tsara"
        expect(result.data.students[0].subjects[0].appreciation).toBe("Tena Tsara")
      }
    })

    it("should return error if classroom not found", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.classroom.findUnique as any).mockResolvedValue(null)

      const result = await getClassGrades(mockClassroomId, mockPeriodId)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Classe non trouvée")
      }
    })

    it("should return error if period not found", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.classroom.findUnique as any).mockResolvedValue({
        id: mockClassroomId,
        schoolId: mockSchoolId,
        schoolGrade: { name: "6ème" },
        track: null,
        section: "A",
      })

      vi.mocked(prisma.period.findUnique as any).mockResolvedValue(null)

      vi.mocked(prisma.subject.findMany as any).mockResolvedValue([])

      const result = await getClassGrades(mockClassroomId, mockPeriodId)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Période non trouvée")
      }
    })

    it("should return empty students array if no students in classroom", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.classroom.findUnique as any).mockResolvedValue({
        id: mockClassroomId,
        schoolId: mockSchoolId,
        schoolGrade: { name: "6ème" },
        track: null,
        section: "A",
      })

      vi.mocked(prisma.period.findUnique as any).mockResolvedValue({
        id: mockPeriodId,
        schoolId: mockSchoolId,
        name: "Trimestre 1",
        schoolYear: "2025-2026",
        examWeight: 0.5,
        dailyWeight: 0.5,
      })

      vi.mocked(prisma.student.findMany as any).mockResolvedValue([])

      vi.mocked(prisma.subject.findMany as any).mockResolvedValue([])

      const result = await getClassGrades(mockClassroomId, mockPeriodId)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.students).toHaveLength(0)
      }
    })
  })
})
