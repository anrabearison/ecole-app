import { describe, it, expect, beforeEach, vi } from "vitest"
import { upsertReportCardComment, getReportCardComment } from "./report-card-comment"
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
const mockPeriodId = "period-1"

describe("report-card-comment actions", () => {
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

  describe("upsertReportCardComment", () => {
    it("should successfully create a new comment", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.reportCardComment.upsert as any).mockResolvedValue({
        id: "comment-1",
        comment: "Excellent travail",
        studentId: mockStudentId,
        periodId: mockPeriodId,
        schoolId: mockSchoolId,
        createdAt: new Date(),
      })

      const result = await upsertReportCardComment({
        comment: "Excellent travail",
        studentId: mockStudentId,
        periodId: mockPeriodId,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.comment).toBe("Excellent travail")
      }
    })

    it("should successfully update an existing comment", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.reportCardComment.upsert as any).mockResolvedValue({
        id: "comment-1",
        comment: "Très bon travail",
        studentId: mockStudentId,
        periodId: mockPeriodId,
        schoolId: mockSchoolId,
        createdAt: new Date(),
      })

      const result = await upsertReportCardComment({
        comment: "Très bon travail",
        studentId: mockStudentId,
        periodId: mockPeriodId,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.comment).toBe("Très bon travail")
      }
    })

    it("should return error if validation fails", async () => {
      mockSession("SCHOOL_ADMIN")

      const result = await upsertReportCardComment({
        comment: "", // Invalid: empty comment
        studentId: mockStudentId,
        periodId: mockPeriodId,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("L'appréciation est requise")
      }
    })

    it("should return error if unauthorized", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await upsertReportCardComment({
        comment: "Test",
        studentId: mockStudentId,
        periodId: mockPeriodId,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Unauthorized")
      }
    })

    it("should return error if schoolId is missing", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "test@test.com",
          role: "SCHOOL_ADMIN",
          schoolId: null,
        },
      } as any)

      const result = await upsertReportCardComment({
        comment: "Test",
        studentId: mockStudentId,
        periodId: mockPeriodId,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("L'identifiant de l'école est manquant")
      }
    })
  })

  describe("getReportCardComment", () => {
    it("should successfully retrieve an existing comment", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.reportCardComment.findUnique as any).mockResolvedValue({
        id: "comment-1",
        comment: "Excellent travail",
        studentId: mockStudentId,
        periodId: mockPeriodId,
        schoolId: mockSchoolId,
        createdAt: new Date(),
      })

      const result = await getReportCardComment(mockStudentId, mockPeriodId)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.comment).toBe("Excellent travail")
      }
    })

    it("should return null when no comment exists", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.reportCardComment.findUnique as any).mockResolvedValue(null)

      const result = await getReportCardComment(mockStudentId, mockPeriodId)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(null)
      }
    })

    it("should return error if unauthorized", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await getReportCardComment(mockStudentId, mockPeriodId)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Unauthorized")
      }
    })

    it("should return error if schoolId is missing", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: "user-1",
          email: "test@test.com",
          role: "SCHOOL_ADMIN",
          schoolId: null,
        },
      } as any)

      const result = await getReportCardComment(mockStudentId, mockPeriodId)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("L'identifiant de l'école est manquant")
      }
    })
  })
})
