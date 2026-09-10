import { describe, it, expect, beforeEach, vi } from "vitest"
import { listDailyAssessmentsWithSelection, saveDailyGradeSelection, getSelectedDailyAssessmentIds } from "./daily-grade-selection"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/auth")
vi.mock("@/lib/permissions", () => ({
  can: vi.fn(() => true),
}))

const mockSchoolId = "school-1"
const mockTeacherId = "teacher-1"
const mockClassroomId = "classroom-1"
const mockSubjectId = "subject-1"
const mockPeriodId = "period-1"

describe("daily-grade-selection actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockTeacherSession = () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-1",
        email: "teacher@test.com",
        role: "TEACHER",
        schoolId: mockSchoolId,
        teacherId: mockTeacherId,
      },
    } as any)
  }

  describe("listDailyAssessmentsWithSelection", () => {
    it("should return assessments with selected=true by default when no selection is saved", async () => {
      mockTeacherSession()

      vi.mocked(prisma.subject.findUnique as any).mockResolvedValue({
        id: mockSubjectId,
        name: "Maths",
      })

      vi.mocked(prisma.assessment.findMany as any).mockResolvedValue([
        { id: "assess-1", date: new Date("2026-09-01"), title: "Quiz 1" },
        { id: "assess-2", date: new Date("2026-09-05"), title: "Quiz 2" },
      ])

      vi.mocked(prisma.dailyGradeSelection.findMany as any).mockResolvedValue([])

      const result = await listDailyAssessmentsWithSelection(mockClassroomId, mockSubjectId, mockPeriodId)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.assessments).toHaveLength(2)
        expect(result.data.assessments[0].selected).toBe(true)
        expect(result.data.assessments[1].selected).toBe(true)
      }
    })

    it("should flag explicitly selected assessments when a saved selection exists", async () => {
      mockTeacherSession()

      vi.mocked(prisma.subject.findUnique as any).mockResolvedValue({
        id: mockSubjectId,
        name: "Maths",
      })

      vi.mocked(prisma.assessment.findMany as any).mockResolvedValue([
        { id: "assess-1", date: new Date("2026-09-01"), title: "Quiz 1" },
        { id: "assess-2", date: new Date("2026-09-05"), title: "Quiz 2" },
      ])

      vi.mocked(prisma.dailyGradeSelection.findMany as any).mockResolvedValue([
        { assessmentId: "assess-1" },
      ])

      const result = await listDailyAssessmentsWithSelection(mockClassroomId, mockSubjectId, mockPeriodId)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.assessments[0].selected).toBe(true)
        expect(result.data.assessments[1].selected).toBe(false)
      }
    })
  })

  describe("getSelectedDailyAssessmentIds", () => {
    it("should return null if no selection row exists", async () => {
      vi.mocked(prisma.dailyGradeSelection.findMany as any).mockResolvedValue([])

      const result = await getSelectedDailyAssessmentIds(mockClassroomId, mockSubjectId, mockPeriodId, mockSchoolId)
      expect(result).toBeNull()
    })

    it("should return array of assessment IDs if selection exists", async () => {
      vi.mocked(prisma.dailyGradeSelection.findMany as any).mockResolvedValue([
        { assessmentId: "assess-1" },
      ])

      const result = await getSelectedDailyAssessmentIds(mockClassroomId, mockSubjectId, mockPeriodId, mockSchoolId)
      expect(result).toEqual(["assess-1"])
    })
  })
})
