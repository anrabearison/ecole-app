import { describe, it, expect, beforeEach, vi } from "vitest"
import { listTracks, createTrack, updateTrack, deleteTrack } from "./track"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Mock auth
vi.mock("@/lib/auth")

// Mock permissions
vi.mock("@/lib/permissions", () => ({
  can: vi.fn(() => true),
}))

const mockSchoolId = "school-1"
const mockSchoolGradeId = "sg1"

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

describe("Track Server Actions", () => {
  describe("listTracks", () => {
    it("should return tracks for SCHOOL_ADMIN", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      const mockData = [
        { 
          id: "t1", 
          name: "A",
          schoolGradeId: mockSchoolGradeId,
          schoolId: mockSchoolId,
          schoolGrade: {
            id: mockSchoolGradeId,
            name: "Première",
            cycle: "HIGH_SCHOOL"
          },
          classrooms: []
        }
      ]
      
      vi.mocked(prisma.track.findMany as any).mockResolvedValue(mockData as any)

      const result = await listTracks()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockData)
      }
    })
  })

  describe("createTrack", () => {
    it("should create track if authorized and schoolGrade belongs to school", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      vi.mocked(prisma.schoolGrade.findUnique as any).mockResolvedValue({
        id: mockSchoolGradeId,
        schoolId: mockSchoolId,
      } as any)
      
      vi.mocked(prisma.track.create as any).mockResolvedValue({
        id: "t1",
        name: "A",
        schoolGradeId: mockSchoolGradeId,
        schoolId: mockSchoolId,
        schoolGrade: {
          id: mockSchoolGradeId,
          name: "Première",
          cycle: "HIGH_SCHOOL"
        },
        classrooms: []
      } as any)
      
      const result = await createTrack({
        name: "A",
        schoolGradeId: mockSchoolGradeId,
      })
      
      expect(result.success).toBe(true)
    })

    it("should refuse if schoolGrade does not belong to school", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      vi.mocked(prisma.schoolGrade.findUnique as any).mockResolvedValue({
        id: mockSchoolGradeId,
        schoolId: "different-school-id",
      } as any)
      
      const result = await createTrack({
        name: "A",
        schoolGradeId: mockSchoolGradeId,
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("School grade not found or does not belong to your school")
      }
    })
  })

  describe("updateTrack", () => {
    it("should allow admin to update track", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      vi.mocked(prisma.schoolGrade.findUnique as any).mockResolvedValue({
        id: mockSchoolGradeId,
        schoolId: mockSchoolId,
      } as any)
      
      vi.mocked(prisma.track.update as any).mockResolvedValue({
        id: "t1",
        name: "B",
        schoolGradeId: mockSchoolGradeId,
        schoolId: mockSchoolId,
        schoolGrade: {
          id: mockSchoolGradeId,
          name: "Première",
          cycle: "HIGH_SCHOOL"
        },
        classrooms: []
      } as any)
      
      const result = await updateTrack("t1", { name: "B" })
      
      expect(result.success).toBe(true)
    })
  })

  describe("deleteTrack", () => {
    it("should allow admin to delete track", async () => {
      mockSession("SCHOOL_ADMIN", mockSchoolId)
      
      vi.mocked(prisma.track.delete as any).mockResolvedValue({ id: "t1" } as any)
      
      const result = await deleteTrack("t1")
      
      expect(result.success).toBe(true)
    })
  })
})
