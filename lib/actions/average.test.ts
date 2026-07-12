import { describe, it, expect, beforeEach, vi } from "vitest"
import { calculateSubjectAverage, calculateGeneralAverage, calculateClassRank, getStudentSubjectAverages } from "./average"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Mock auth
vi.mock("@/lib/auth")

// Mock permissions
vi.mock("@/lib/permissions", () => ({
  can: vi.fn(() => true),
}))

const mockSchoolId = "school-1"
const mockStudentId = "student-1"
const mockSubjectId = "subject-1"
const mockPeriodId = "period-1"
const mockClassroomId = "classroom-1"

describe("average actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSession = (role: string, studentId?: string) => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-1",
        email: "test@test.com",
        role,
        schoolId: mockSchoolId,
        studentId,
      },
    } as any)
  }

  describe("calculateSubjectAverage", () => {
    it("should calculate weighted average with exam and daily grades", async () => {
      mockSession("STUDENT", mockStudentId)
      
      vi.mocked(prisma.period.findUnique as any).mockResolvedValue({
        examWeight: 0.6,
        dailyWeight: 0.4,
      })
      
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue([
        { type: "EXAM", value: 16 },
        { type: "EXAM", value: 14 },
        { type: "DAILY", value: 12 },
        { type: "DAILY", value: 18 },
      ])
      
      const result = await calculateSubjectAverage(mockStudentId, mockSubjectId, mockPeriodId)
      
      expect(result.success).toBe(true)
      if (result.success) {
        // Exam avg: (16 + 14) / 2 = 15
        // Daily avg: (12 + 18) / 2 = 15
        // Weighted: 15 * 0.6 + 15 * 0.4 = 15
        expect(result.data).toBe(15)
      }
    })

    it("should return 0 when no grades exist", async () => {
      mockSession("STUDENT", mockStudentId)
      
      vi.mocked(prisma.period.findUnique as any).mockResolvedValue({
        examWeight: 0.6,
        dailyWeight: 0.4,
      })
      
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue([])
      
      const result = await calculateSubjectAverage(mockStudentId, mockSubjectId, mockPeriodId)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(0)
      }
    })

    it("should handle only exam grades", async () => {
      mockSession("STUDENT", mockStudentId)
      
      vi.mocked(prisma.period.findUnique as any).mockResolvedValue({
        examWeight: 0.6,
        dailyWeight: 0.4,
      })
      
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue([
        { type: "EXAM", value: 16 },
        { type: "EXAM", value: 14 },
      ])
      
      const result = await calculateSubjectAverage(mockStudentId, mockSubjectId, mockPeriodId)
      
      expect(result.success).toBe(true)
      if (result.success) {
        // Exam avg: 15, Daily avg: 0
        // Weighted: 15 * 0.6 + 0 * 0.4 = 9
        expect(result.data).toBe(9)
      }
    })
  })

  describe("calculateGeneralAverage", () => {
    it("should return 0 when no grades exist", async () => {
      mockSession("STUDENT", mockStudentId)
      
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue([])
      
      const result = await calculateGeneralAverage(mockStudentId, mockPeriodId)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(0)
      }
    })
  })

  describe("calculateClassRank", () => {
    it("should handle empty class", async () => {
      mockSession("STUDENT", mockStudentId)
      
      vi.mocked(prisma.student.findMany as any).mockResolvedValue([])
      
      const result = await calculateClassRank(mockStudentId, mockClassroomId, mockPeriodId)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rank).toBe(0)
        expect(result.data.totalStudents).toBe(0)
      }
    })
  })

  describe("getStudentSubjectAverages", () => {
    it("should return empty array when no grades exist", async () => {
      mockSession("STUDENT", mockStudentId)
      
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue([])
      
      const result = await getStudentSubjectAverages(mockStudentId, mockPeriodId)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(0)
      }
    })
  })
})
