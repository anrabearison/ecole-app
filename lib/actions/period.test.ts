import { describe, it, expect, vi, beforeEach } from "vitest"
import { listPeriods, createPeriod, deletePeriod, getPeriodById, updatePeriod } from "./period"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

vi.mock("@/lib/auth")

describe("Period Actions", () => {
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
    vi.mocked(auth).mockResolvedValue(mockSession as any)
  })

  describe("listPeriods", () => {
    it("should return periods for the school", async () => {
      const mockPeriods = [
        { id: "1", name: "Trimestre 1", order: 1, schoolYear: "2025-2026", schoolId: "school-1", examWeight: 0.6, dailyWeight: 0.4 },
        { id: "2", name: "Trimestre 2", order: 2, schoolYear: "2025-2026", schoolId: "school-1", examWeight: 0.6, dailyWeight: 0.4 },
      ]

      vi.mocked(prisma.period.findMany).mockResolvedValue(mockPeriods as any)
      vi.mocked(prisma.period.count).mockResolvedValue(2)

      const result = await listPeriods()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(2)
        expect(result.data[0].name).toBe("Trimestre 1")
      }
      expect(prisma.period.findMany).toHaveBeenCalledWith({
        where: { schoolId: "school-1" },
        orderBy: [{ schoolYear: "desc" }, { order: "asc" }],
        skip: 0,
        take: 20,
      })
    })

    it("should return unauthorized if not logged in", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      const result = await listPeriods()
      expect(result.success).toBe(false)
    })

    it("should filter by search term", async () => {
      vi.mocked(prisma.period.findMany).mockResolvedValue([] as any)
      vi.mocked(prisma.period.count).mockResolvedValue(0)

      const result = await listPeriods({ search: "Trimestre" })

      expect(result.success).toBe(true)
      expect(prisma.period.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: "school-1",
          OR: [
            { name: { contains: "Trimestre", mode: "insensitive" } },
            { schoolYear: { contains: "Trimestre", mode: "insensitive" } },
          ],
        },
        orderBy: [{ schoolYear: "desc" }, { order: "asc" }],
        skip: 0,
        take: 20,
      })
    })
  })

  describe("createPeriod", () => {
    it("should create a new period", async () => {
      vi.mocked(prisma.period.create).mockResolvedValue({
        id: "new-period",
        name: "Trimestre 3",
        order: 3,
        schoolYear: "2025-2026",
        examWeight: 0.6,
        dailyWeight: 0.4,
        schoolId: "school-1",
      } as any)

      const result = await createPeriod({
        name: "Trimestre 3",
        order: 3,
        schoolYear: "2025-2026",
        examWeight: 0.6,
        dailyWeight: 0.4,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("Trimestre 3")
      }
      expect(prisma.period.create).toHaveBeenCalledWith({
        data: {
          name: "Trimestre 3",
          order: 3,
          schoolYear: "2025-2026",
          examWeight: 0.6,
          dailyWeight: 0.4,
          schoolId: "school-1",
        },
      })
    })

    it("should validate that weights sum to 1.0", async () => {
      const result = await createPeriod({
        name: "Trimestre 3",
        order: 3,
        schoolYear: "2025-2026",
        examWeight: 0.5,
        dailyWeight: 0.3, // sums to 0.8, should fail
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("La somme des poids doit être égale à 1.0")
      }
    })

    it("should handle unique constraint violation", async () => {
      const error = new Error("Unique constraint violation") as any
      error.code = 'P2002'
      vi.mocked(prisma.period.create).mockRejectedValue(error)

      const result = await createPeriod({
        name: "Trimestre 1",
        order: 1,
        schoolYear: "2025-2026",
        examWeight: 0.6,
        dailyWeight: 0.4,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Une période avec ce nom existe déjà pour cette année scolaire")
      }
    })
  })

  describe("deletePeriod", () => {
    it("should delete period if it belongs to school", async () => {
      vi.mocked(prisma.period.delete).mockResolvedValue({
        id: "period-1",
        name: "Trimestre 1",
        schoolId: "school-1",
      } as any)

      const formData = new FormData()
      formData.set("id", "period-1")

      const result = await deletePeriod(formData)

      expect(result.success).toBe(true)
      expect(prisma.period.delete).toHaveBeenCalledWith({
        where: { id: "period-1", schoolId: "school-1" },
      })
    })

    it("should fail if period does not exist", async () => {
      const error = new Error("Record not found") as any
      vi.mocked(prisma.period.delete).mockRejectedValue(error)

      const formData = new FormData()
      formData.set("id", "non-existent")

      const result = await deletePeriod(formData)

      expect(result.success).toBe(false)
    })
  })

  describe("getPeriodById", () => {
    it("should return period if it exists and belongs to school", async () => {
      vi.mocked(prisma.period.findUnique).mockResolvedValue({
        id: "period-1",
        name: "Trimestre 1",
        order: 1,
        schoolYear: "2025-2026",
        schoolId: "school-1",
        examWeight: 0.6,
        dailyWeight: 0.4,
      } as any)

      const result = await getPeriodById("period-1")

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("Trimestre 1")
      }
      expect(prisma.period.findUnique).toHaveBeenCalledWith({
        where: { id: "period-1" },
      })
    })

    it("should return error if period does not exist", async () => {
      vi.mocked(prisma.period.findUnique).mockResolvedValue(null)

      const result = await getPeriodById("non-existent")

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Période non trouvée")
      }
    })

    it("should return forbidden if period belongs to another school", async () => {
      vi.mocked(prisma.period.findUnique).mockResolvedValue({
        id: "period-1",
        name: "Trimestre 1",
        schoolId: "other-school",
      } as any)

      const result = await getPeriodById("period-1")

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Forbidden")
      }
    })
  })

  describe("updatePeriod", () => {
    it("should update an existing period", async () => {
      vi.mocked(prisma.period.update).mockResolvedValue({
        id: "period-1",
        name: "Trimestre 1 (Modifié)",
        order: 1,
        schoolYear: "2025-2026",
        examWeight: 0.7,
        dailyWeight: 0.3,
        schoolId: "school-1",
      } as any)

      const result = await updatePeriod("period-1", {
        name: "Trimestre 1 (Modifié)",
        order: 1,
        schoolYear: "2025-2026",
        examWeight: 0.7,
        dailyWeight: 0.3,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("Trimestre 1 (Modifié)")
      }
      expect(prisma.period.update).toHaveBeenCalledWith({
        where: { id: "period-1", schoolId: "school-1" },
        data: {
          name: "Trimestre 1 (Modifié)",
          order: 1,
          schoolYear: "2025-2026",
          examWeight: 0.7,
          dailyWeight: 0.3,
        },
      })
    })

    it("should validate that weights sum to 1.0", async () => {
      const result = await updatePeriod("period-1", {
        name: "Trimestre 1",
        order: 1,
        schoolYear: "2025-2026",
        examWeight: 0.5,
        dailyWeight: 0.3,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("La somme des poids doit être égale à 1.0")
      }
      expect(prisma.period.update).not.toHaveBeenCalled()
    })

    it("should handle unique constraint violation", async () => {
      const error = new Error("Unique constraint violation") as any
      error.code = 'P2002'
      vi.mocked(prisma.period.update).mockRejectedValue(error)

      const result = await updatePeriod("period-1", {
        name: "Trimestre 2",
        order: 2,
        schoolYear: "2025-2026",
        examWeight: 0.6,
        dailyWeight: 0.4,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Une période avec ce nom existe déjà pour cette année scolaire")
      }
    })
  })
})
