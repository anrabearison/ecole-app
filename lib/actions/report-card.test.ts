import { describe, it, expect, beforeEach, vi } from "vitest"
import { generateReportCardPdf } from "./report-card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStudentSubjectAverages, calculateGeneralAverage, calculateClassRank } from "./average"
import { getReportCardComment } from "./report-card-comment"

// Mock auth
vi.mock("@/lib/auth")

// Mock permissions
vi.mock("@/lib/permissions", () => ({
  can: vi.fn(() => true),
}))

// Mock average functions
vi.mock("./average", () => ({
  getStudentSubjectAverages: vi.fn(),
  calculateGeneralAverage: vi.fn(),
  calculateClassRank: vi.fn(),
}))

// Mock report-card-comment
vi.mock("./report-card-comment", () => ({
  getReportCardComment: vi.fn(),
}))

const mockSchoolId = "school-1"
const mockStudentId = "student-1"
const mockPeriodId = "period-1"
const mockClassroomId = "classroom-1"

describe("report-card actions", () => {
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

  describe("generateReportCardPdf", () => {
    it("should successfully generate PDF for SCHOOL_ADMIN", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.student.findUnique as any).mockResolvedValue({
        id: mockStudentId,
        firstName: "Jean",
        lastName: "Dupont",
        classroom: {
          schoolGrade: { name: "6ème" },
          track: null,
          section: "A",
          schoolYear: "2025-2026",
        },
        school: {
          name: "Sekoly Test",
          address: "Amboavory",
        },
      })

      vi.mocked(prisma.period.findUnique as any).mockResolvedValue({
        id: mockPeriodId,
        name: "Trimestre 1",
        schoolYear: "2025-2026",
      })

      vi.mocked(getStudentSubjectAverages).mockResolvedValue({
        success: true,
        data: [
          { subjectId: "subject-1", subjectName: "Mathématiques", coefficient: 1.0, average: 15.5 },
          { subjectId: "subject-2", subjectName: "Français", coefficient: 1.0, average: 14.0 },
        ],
      })

      vi.mocked(calculateGeneralAverage).mockResolvedValue({
        success: true,
        data: 14.75,
      })

      vi.mocked(calculateClassRank).mockResolvedValue({
        success: true,
        data: { rank: 5, totalStudents: 25, studentId: mockStudentId },
      })

      vi.mocked(getReportCardComment).mockResolvedValue({
        success: true,
        data: { 
          id: "comment-1",
          comment: "Bon travail",
          studentId: mockStudentId,
          periodId: mockPeriodId,
          schoolId: mockSchoolId,
          createdAt: new Date(),
        },
      })

      const result = await generateReportCardPdf(mockStudentId, mockPeriodId)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.pdfBuffer).toBeDefined()
        expect(result.data.fileName).toContain("Bulletin")
        expect(result.data.fileName).toContain("Dupont")
        expect(result.data.fileName).toContain("Trimestre_1")
      }
    })

    it("should successfully generate PDF for STUDENT viewing their own report", async () => {
      mockSession("STUDENT", mockStudentId)

      vi.mocked(prisma.student.findUnique as any).mockResolvedValue({
        id: mockStudentId,
        firstName: "Jean",
        lastName: "Dupont",
        classroom: {
          schoolGrade: { name: "6ème" },
          track: null,
          section: "A",
          schoolYear: "2025-2026",
        },
        school: {
          name: "Sekoly Test",
          address: "Amboavory",
        },
      })

      vi.mocked(prisma.period.findUnique as any).mockResolvedValue({
        id: mockPeriodId,
        name: "Trimestre 1",
        schoolYear: "2025-2026",
      })

      vi.mocked(getStudentSubjectAverages).mockResolvedValue({
        success: true,
        data: [],
      })

      vi.mocked(calculateGeneralAverage).mockResolvedValue({
        success: true,
        data: 0,
      })

      vi.mocked(calculateClassRank).mockResolvedValue({
        success: true,
        data: { rank: 0, totalStudents: 0, studentId: mockStudentId },
      })

      vi.mocked(getReportCardComment).mockResolvedValue({
        success: true,
        data: null as any,
      })

      const result = await generateReportCardPdf(mockStudentId, mockPeriodId)

      expect(result.success).toBe(true)
    })

    it("should forbid STUDENT from accessing another student's report", async () => {
      mockSession("STUDENT", "other-student-id")

      const result = await generateReportCardPdf(mockStudentId, mockPeriodId)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Forbidden")
      }
    })

    it("should return error if student not found", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.student.findUnique as any).mockResolvedValue(null)

      const result = await generateReportCardPdf(mockStudentId, mockPeriodId)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Élève non trouvé")
      }
    })

    it("should return error if period not found", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.student.findUnique as any).mockResolvedValue({
        id: mockStudentId,
        firstName: "Jean",
        lastName: "Dupont",
        classroom: {
          schoolGrade: { name: "6ème" },
          track: null,
          section: "A",
          schoolYear: "2025-2026",
        },
        school: {
          name: "Sekoly Test",
          address: "Amboavory",
        },
      })

      vi.mocked(prisma.period.findUnique as any).mockResolvedValue(null)

      const result = await generateReportCardPdf(mockStudentId, mockPeriodId)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Période non trouvée")
      }
    })

    it("should return error if unauthorized", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await generateReportCardPdf(mockStudentId, mockPeriodId)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Unauthorized")
      }
    })
  })
})
