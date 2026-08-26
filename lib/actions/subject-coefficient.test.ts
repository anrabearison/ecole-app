import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getEffectiveCoefficient,
  upsertSubjectCoefficient,
  deleteSubjectCoefficient,
} from "./subject-coefficient"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

vi.mock("@/lib/auth")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

describe("SubjectCoefficient Actions & Fallback Chain", () => {
  const mockSession = {
    user: {
      id: "admin-1",
      email: "admin@test.com",
      role: "SCHOOL_ADMIN",
      schoolId: "school-1",
    },
    expires: "2050-01-01T00:00:00.000Z",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(mockSession as any)
  })

  describe("getEffectiveCoefficient (Fallback Chain)", () => {
    it("should return track-specific coefficient when available (Priority 1)", async () => {
      vi.mocked(prisma.subjectCoefficient.findFirst).mockResolvedValueOnce({
        coefficient: 5.0,
      } as any)

      const coeff = await getEffectiveCoefficient("subj-math", "grade-prem", "track-c", "school-1")
      expect(coeff).toBe(5.0)
      expect(prisma.subjectCoefficient.findFirst).toHaveBeenCalledWith({
        where: { subjectId: "subj-math", schoolGradeId: "grade-prem", trackId: "track-c", schoolId: "school-1" },
        select: { coefficient: true },
      })
    })

    it("should fallback to grade-level coefficient when track-specific is missing (Priority 2)", async () => {
      // 1st call for specific track returns null
      vi.mocked(prisma.subjectCoefficient.findFirst).mockResolvedValueOnce(null)
      // 2nd call for grade-level (trackId = null) returns 4.0
      vi.mocked(prisma.subjectCoefficient.findFirst).mockResolvedValueOnce({
        coefficient: 4.0,
      } as any)

      const coeff = await getEffectiveCoefficient("subj-math", "grade-prem", "track-a", "school-1")
      expect(coeff).toBe(4.0)
    })

    it("should fallback to global Subject.coefficient when no SubjectCoefficient exists (Priority 3)", async () => {
      // 1st call for track returns null
      vi.mocked(prisma.subjectCoefficient.findFirst).mockResolvedValueOnce(null)
      // 2nd call for grade returns null
      vi.mocked(prisma.subjectCoefficient.findFirst).mockResolvedValueOnce(null)
      // Subject lookup returns global default 2.0
      vi.mocked(prisma.subject.findUnique).mockResolvedValueOnce({ coefficient: 2.0 } as any)

      const coeff = await getEffectiveCoefficient("subj-math", "grade-6eme", null, "school-1")
      expect(coeff).toBe(2.0)
    })
  })

  describe("upsertSubjectCoefficient", () => {
    it("should update an existing entry if one exists", async () => {
      vi.mocked(prisma.subjectCoefficient.findFirst).mockResolvedValueOnce({ id: "sc-1" } as any)
      vi.mocked(prisma.subjectCoefficient.update).mockResolvedValueOnce({ id: "sc-1" } as any)

      const res = await upsertSubjectCoefficient({
        subjectId: "subj-1",
        schoolGradeId: "grade-1",
        trackId: "track-c",
        coefficient: 5,
      })

      expect(res.success).toBe(true)
      expect(prisma.subjectCoefficient.update).toHaveBeenCalledWith({
        where: { id: "sc-1" },
        data: { coefficient: 5 },
        select: { id: true },
      })
    })

    it("should create a new entry if none exists", async () => {
      vi.mocked(prisma.subjectCoefficient.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.subjectCoefficient.create).mockResolvedValueOnce({ id: "new-sc" } as any)

      const res = await upsertSubjectCoefficient({
        subjectId: "subj-1",
        schoolGradeId: "grade-1",
        trackId: null,
        coefficient: 3.5,
      })

      expect(res.success).toBe(true)
      expect(prisma.subjectCoefficient.create).toHaveBeenCalledWith({
        data: {
          subjectId: "subj-1",
          schoolGradeId: "grade-1",
          trackId: null,
          coefficient: 3.5,
          schoolId: "school-1",
        },
        select: { id: true },
      })
    })
  })

  describe("deleteSubjectCoefficient", () => {
    it("should delete coefficient entry for school", async () => {
      vi.mocked(prisma.subjectCoefficient.deleteMany).mockResolvedValueOnce({ count: 1 } as any)

      const res = await deleteSubjectCoefficient("sc-1")
      expect(res.success).toBe(true)
      expect(prisma.subjectCoefficient.deleteMany).toHaveBeenCalledWith({
        where: { id: "sc-1", schoolId: "school-1" },
      })
    })
  })
})
