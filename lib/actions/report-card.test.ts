import { describe, it, expect, beforeEach, vi } from "vitest"
import { generateReportCardPdf } from "./report-card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStudentSubjectAverages, calculateGeneralAverage, calculateClassRank, calculateSubjectAverage, calculateSubjectRank } from "./average"
import { getReportCardComment } from "./report-card-comment"

import { generateReportCardPdfBuffer } from "@/lib/pdf/generate-pdf-react"

// Mock auth
vi.mock("@/lib/auth")

// Mock permissions
vi.mock("@/lib/permissions", () => ({
  can: vi.fn(() => true),
}))

// Mock pdf generation
vi.mock("@/lib/pdf/generate-pdf", () => ({
  generateReportCardPdfBuffer: vi.fn().mockResolvedValue(Buffer.from("mock pdf content")),
}))

vi.mock("@/lib/pdf/generate-pdf-react", () => ({
  generateReportCardPdfBuffer: vi.fn().mockResolvedValue(Buffer.from("mock pdf content")),
}))

// Mock daily grade selection
vi.mock("./daily-grade-selection", () => ({
  getSelectedDailyAssessmentIds: vi.fn().mockResolvedValue(null),
}))

// Mock subject coefficient
vi.mock("./subject-coefficient", () => ({
  getEffectiveCoefficient: vi.fn().mockResolvedValue(1.0),
}))

// Mock average functions
vi.mock("./average", () => ({
  getStudentSubjectAverages: vi.fn(),
  calculateGeneralAverage: vi.fn(),
  calculateClassRank: vi.fn(),
  calculateSubjectAverage: vi.fn(),
  calculateSubjectRank: vi.fn(),
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
        classroomId: mockClassroomId,
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

      // Mock the daily grade selection query
      vi.mocked(prisma.assessment.findMany).mockImplementation(() => [] as any)

      vi.mocked(prisma.subject.findUnique as any).mockResolvedValue({
        id: "subject-1",
        language: "FRENCH",
      })

      vi.mocked(prisma.subject.findMany as any).mockResolvedValue([
        { id: "subject-1", language: "FRENCH" },
        { id: "subject-2", language: "FRENCH" },
      ])

      vi.mocked(prisma.grade.findMany as any).mockImplementation((args: any) => {
        // Return empty array for the batch query with where: { studentId, assessment: { subjectId: { in: [...] } } } }
        if (args.where?.assessment?.subjectId?.in) {
          return Promise.resolve([])
        }
        return Promise.resolve([])
      })

      vi.mocked(getStudentSubjectAverages).mockResolvedValue({
        success: true,
        data: [
          { subjectId: "subject-1", subjectName: "Mathématiques", coefficient: 1.0, average: 15.5 },
          { subjectId: "subject-2", subjectName: "Français", coefficient: 1.0, average: 14.0 },
        ],
      })

      vi.mocked(calculateSubjectAverage).mockResolvedValue({
        success: true,
        data: 15.5,
      })

      vi.mocked(calculateSubjectRank).mockResolvedValue({
        success: true,
        data: { studentId: "student-1", subjectId: "subject-1", rank: 1, totalStudents: 25 },
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
        expect(result.data.pdfBase64).toBeDefined()
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
        classroomId: mockClassroomId,
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

      vi.mocked(prisma.assessment.findMany as any).mockResolvedValue([])

      vi.mocked(prisma.subject.findUnique as any).mockResolvedValue({
        id: "subject-1",
        language: "FRENCH",
      })

      vi.mocked(prisma.subject.findMany as any).mockResolvedValue([])

      vi.mocked(prisma.grade.findMany as any).mockImplementation((args: any) => {
        // Return empty array for the batch query with where: { studentId, assessment: { subjectId: { in: [...] } } } }
        if (args.where?.assessment?.subjectId?.in) {
          return Promise.resolve([])
        }
        return Promise.resolve([])
      })

      vi.mocked(getStudentSubjectAverages).mockResolvedValue({
        success: true,
        data: [],
      })

      vi.mocked(calculateSubjectAverage).mockResolvedValue({
        success: true,
        data: 0,
      })

      vi.mocked(calculateSubjectRank).mockResolvedValue({
        success: true,
        data: { studentId: "student-1", subjectId: "subject-1", rank: 0, totalStudents: 0 },
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
        classroomId: mockClassroomId,
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

      // Mock other queries that are now required (they won't be reached due to early return)
      vi.mocked(prisma.assessment.findMany as any).mockResolvedValue([])
      vi.mocked(prisma.subject.findUnique as any).mockResolvedValue({
        id: "subject-1",
        language: "FRENCH",
      })
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue([])
      vi.mocked(calculateSubjectAverage).mockResolvedValue({
        success: true,
        data: 0,
      })
      vi.mocked(calculateSubjectRank).mockResolvedValue({
        success: true,
        data: { studentId: "student-1", subjectId: "subject-1", rank: 0, totalStudents: 0 },
      })

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
