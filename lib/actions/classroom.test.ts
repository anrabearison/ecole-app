import { describe, it, expect, beforeEach, vi } from "vitest"
import { listClassrooms, createClassroom, updateClassroom, deleteClassroom } from "./classroom"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

describe("Classroom Server Actions", () => {
  const mockSchoolId = "school-123"

  const mockSession = (role: any = "SCHOOL_ADMIN", schoolId: string | null = mockSchoolId) => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-123",
        email: "test@example.com",
        role,
        schoolId,
        teacherId: null,
        studentId: null,
      },
      expires: "9999-12-31T23:59:59.999Z"
    } as any)
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listClassrooms", () => {
    it("should return classrooms filtered by schoolId", async () => {
      mockSession()
      
      const mockData = [
        { id: "c1", section: "A" }
      ]
      
      vi.mocked(prisma.classroom.findMany).mockResolvedValue(mockData as any)

      const result = await listClassrooms()

      expect(prisma.classroom.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: mockSchoolId }
        })
      )
      expect(result).toEqual({ success: true, data: mockData })
    })
  })

  describe("createClassroom", () => {
    it("should create a classroom with valid data", async () => {
      mockSession("SCHOOL_ADMIN")
      
      const input = {
        section: "A",
        schoolYear: "2025-2026",
        schoolGradeId: "grade-1",
        passingThreshold: 10,
      }
      
      vi.mocked(prisma.schoolGrade.findUnique).mockResolvedValue({
        id: "grade-1",
        schoolId: mockSchoolId
      } as any)

      const createdClassroom = { id: "c1", ...input, schoolId: mockSchoolId }
      vi.mocked(prisma.classroom.create).mockResolvedValue(createdClassroom as any)

      const result = await createClassroom(input)

      expect(prisma.classroom.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
            section: "A"
          })
        })
      )
      expect(result).toEqual({ success: true, data: createdClassroom })
    })

    it("should return error for invalid data without calling Prisma", async () => {
      mockSession("SCHOOL_ADMIN")
      
      // Invalid data: section is empty
      const input = { section: "", schoolYear: "2025", schoolGradeId: "g1" } as any
      
      const result = await createClassroom(input)
      
      expect(result.success).toBe(false)
      expect(prisma.classroom.create).not.toHaveBeenCalled()
    })

    it("should return Forbidden for unauthorized role (e.g. TEACHER)", async () => {
      mockSession("TEACHER")
      
      const input = {
        section: "A",
        schoolYear: "2025-2026",
        schoolGradeId: "grade-1",
        passingThreshold: 10,
      }
      
      const result = await createClassroom(input)
      
      expect(result).toEqual({ success: false, error: "Forbidden" })
      expect(prisma.classroom.create).not.toHaveBeenCalled()
    })
  })

  describe("updateClassroom", () => {
    it("should successfully update with valid data", async () => {
      mockSession("SCHOOL_ADMIN")
      
      vi.mocked(prisma.classroom.findUnique).mockResolvedValue({
        id: "c1",
        schoolId: mockSchoolId
      } as any)
      
      const mockUpdated = { id: "c1", section: "B" }
      vi.mocked(prisma.classroom.update).mockResolvedValue(mockUpdated as any)
      
      const result = await updateClassroom("c1", { section: "B" })
      
      expect(result).toEqual({ success: true, data: mockUpdated })
    })

    it("should return error for invalid data without calling Prisma", async () => {
      mockSession("SCHOOL_ADMIN")
      const result = await updateClassroom("c1", { section: "" })
      expect(result.success).toBe(false)
      expect(prisma.classroom.update).not.toHaveBeenCalled()
    })

    it("should return Forbidden for unauthorized role", async () => {
      mockSession("TEACHER")
      const result = await updateClassroom("c1", { section: "B" })
      expect(result.success).toBe(false)
      expect(prisma.classroom.update).not.toHaveBeenCalled()
    })
  })

  describe("deleteClassroom", () => {
    it("should successfully delete", async () => {
      mockSession("SCHOOL_ADMIN")
      
      vi.mocked(prisma.classroom.findUnique).mockResolvedValue({
        id: "c1",
        schoolId: mockSchoolId
      } as any)
      
      vi.mocked(prisma.classroom.delete).mockResolvedValue({ id: "c1" } as any)
      
      const result = await deleteClassroom("c1")
      
      expect(result).toEqual({ success: true, data: undefined })
    })

    it("should return Forbidden for unauthorized role", async () => {
      mockSession("TEACHER")
      const result = await deleteClassroom("c1")
      expect(result.success).toBe(false)
      expect(prisma.classroom.delete).not.toHaveBeenCalled()
    })
  })
})
