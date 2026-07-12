import { describe, it, expect, beforeEach, vi } from "vitest"
import { listSchoolGrades, createSchoolGrade, updateSchoolGrade, deleteSchoolGrade } from "./school-grade"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Mock auth
vi.mock("@/lib/auth")

// Mock permissions
vi.mock("@/lib/permissions", () => ({
  can: vi.fn(() => true),
}))

const mockSchoolId = "school-1"

function mockSession(role: string, schoolId?: string) {
  vi.mocked(auth).mockResolvedValue({
    user: {
      id: "user-1",
      email: "test@example.com",
      role: role as any,
      schoolId: schoolId || null,
      teacherId: null,
      studentId: null,
    },
    expires: "9999-12-31T23:59:59.999Z",
  } as any)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("SchoolGrade Server Actions", () => {
  describe("listSchoolGrades", () => {
    it("should return school grades for SCHOOL_ADMIN", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      const mockData = [
        { 
          id: "sg1", 
          name: "6ème",
          cycle: "MIDDLE_SCHOOL",
          order: 1,
          schoolId: mockSchoolId,
          tracks: [],
          classrooms: []
        }
      ]
      
      vi.mocked(prisma.schoolGrade.findMany as any).mockResolvedValue(mockData as any)

      const result = await listSchoolGrades()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockData)
      }
    })
  })

  describe("createSchoolGrade", () => {
    it("should create school grade if authorized", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      vi.mocked(prisma.schoolGrade.create as any).mockResolvedValue({
        id: "sg1",
        name: "6ème",
        cycle: "MIDDLE_SCHOOL",
        order: 1,
        schoolId: mockSchoolId,
        tracks: [],
        classrooms: []
      } as any)
      
      const result = await createSchoolGrade({
        name: "6ème",
        cycle: "MIDDLE_SCHOOL",
        order: 1,
      })
      
      expect(result.success).toBe(true)
    })
  })

  describe("updateSchoolGrade", () => {
    it("should allow admin to update school grade", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      vi.mocked(prisma.schoolGrade.update as any).mockResolvedValue({
        id: "sg1",
        name: "5ème",
        cycle: "MIDDLE_SCHOOL",
        order: 2,
        schoolId: mockSchoolId,
        tracks: [],
        classrooms: []
      } as any)
      
      const result = await updateSchoolGrade("sg1", { name: "5ème" })
      
      expect(result.success).toBe(true)
    })
  })

  describe("deleteSchoolGrade", () => {
    it("should allow admin to delete school grade when no dependencies exist", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)

      vi.mocked(prisma.schoolGrade.findUnique as any).mockResolvedValue({ id: "sg1", schoolId: mockSchoolId } as any)
      vi.mocked(prisma.track.count as any).mockResolvedValue(0)
      vi.mocked(prisma.classroom.count as any).mockResolvedValue(0)
      vi.mocked(prisma.schoolGrade.delete as any).mockResolvedValue({ id: "sg1" } as any)

      const result = await deleteSchoolGrade("sg1")

      expect(result.success).toBe(true)
    })

    it("should refuse deletion when tracks depend on the school grade", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)

      vi.mocked(prisma.schoolGrade.findUnique as any).mockResolvedValue({ id: "sg2", schoolId: mockSchoolId } as any)
      vi.mocked(prisma.track.count as any).mockResolvedValue(1)

      const result = await deleteSchoolGrade("sg2")

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Impossible de supprimer ce niveau : des filières y sont rattachées.")
      }
    })

    it("should refuse deletion when classrooms depend on the school grade", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)

      vi.mocked(prisma.schoolGrade.findUnique as any).mockResolvedValue({ id: "sg3", schoolId: mockSchoolId } as any)
      vi.mocked(prisma.track.count as any).mockResolvedValue(0)
      vi.mocked(prisma.classroom.count as any).mockResolvedValue(2)

      const result = await deleteSchoolGrade("sg3")

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Impossible de supprimer ce niveau : des classes y sont rattachées.")
      }
    })
  })
})
