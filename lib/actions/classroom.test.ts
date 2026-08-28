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
      vi.mocked(prisma.classroom.count).mockResolvedValue(1)

      const result = await listClassrooms()

      expect(prisma.classroom.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: mockSchoolId }
        })
      )
      expect(result).toEqual(expect.objectContaining({ success: true, data: mockData }))
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

    it("should create a classroom without track (levels without series like primary/middle school)", async () => {
      mockSession("SCHOOL_ADMIN")

      const input = {
        section: "A",
        schoolYear: "2025-2026",
        schoolGradeId: "grade-1",
        passingThreshold: 10,
        trackId: undefined, // No track for primary/middle school levels
      }

      vi.mocked(prisma.schoolGrade.findUnique).mockResolvedValue({
        id: "grade-1",
        schoolId: mockSchoolId
      } as any)

      vi.mocked(prisma.classroom.findFirst).mockResolvedValue(null) // No existing classroom

      const createdClassroom = { id: "c1", ...input, schoolId: mockSchoolId, trackId: null }
      vi.mocked(prisma.classroom.create).mockResolvedValue(createdClassroom as any)

      const result = await createClassroom(input)

      expect(prisma.classroom.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolGradeId: "grade-1",
            section: "A",
            schoolYear: "2025-2026",
            trackId: null,
          })
        })
      )
      expect(prisma.classroom.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
            section: "A",
            trackId: null,
          })
        })
      )
      expect(result).toEqual({ success: true, data: createdClassroom })
    })

    it("should handle empty string trackId by converting to null", async () => {
      mockSession("SCHOOL_ADMIN")

      const input = {
        section: "B",
        schoolYear: "2025-2026",
        schoolGradeId: "grade-1",
        passingThreshold: 10,
        trackId: "", // Empty string should be treated as null
      }

      vi.mocked(prisma.schoolGrade.findUnique).mockResolvedValue({
        id: "grade-1",
        schoolId: mockSchoolId
      } as any)

      vi.mocked(prisma.classroom.findFirst).mockResolvedValue(null)

      const createdClassroom = { id: "c2", ...input, schoolId: mockSchoolId, trackId: null }
      vi.mocked(prisma.classroom.create).mockResolvedValue(createdClassroom as any)

      const result = await createClassroom(input)

      expect(prisma.classroom.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            trackId: null, // Should be null, not empty string
          })
        })
      )
      expect(result).toEqual({ success: true, data: createdClassroom })
    })

    it("should create a classroom with homeroom teacher", async () => {
      mockSession("SCHOOL_ADMIN")

      const input = {
        section: "C",
        schoolYear: "2025-2026",
        schoolGradeId: "grade-1",
        passingThreshold: 10,
        homeroomTeacherId: "teacher-1",
      }

      vi.mocked(prisma.schoolGrade.findUnique).mockResolvedValue({
        id: "grade-1",
        schoolId: mockSchoolId
      } as any)

      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: "teacher-1",
        schoolId: mockSchoolId
      } as any)

      vi.mocked(prisma.classroom.findFirst).mockResolvedValue(null)

      const createdClassroom = { id: "c3", ...input, schoolId: mockSchoolId }
      vi.mocked(prisma.classroom.create).mockResolvedValue(createdClassroom as any)

      const result = await createClassroom(input)

      expect(prisma.teacher.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "teacher-1" }
        })
      )
      expect(prisma.classroom.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            homeroomTeacherId: "teacher-1",
          })
        })
      )
      expect(result).toEqual({ success: true, data: createdClassroom })
    })

    it("should reject homeroom teacher from different school", async () => {
      mockSession("SCHOOL_ADMIN")

      const input = {
        section: "D",
        schoolYear: "2025-2026",
        schoolGradeId: "grade-1",
        passingThreshold: 10,
        homeroomTeacherId: "teacher-external",
      }

      vi.mocked(prisma.schoolGrade.findUnique).mockResolvedValue({
        id: "grade-1",
        schoolId: mockSchoolId
      } as any)

      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: "teacher-external",
        schoolId: "different-school-id" // Different school
      } as any)

      const result = await createClassroom(input)

      expect(result).toEqual({ success: false, error: "L'enseignant sélectionné n'appartient pas à cette école" })
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

    it("should update homeroom teacher successfully", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.classroom.findUnique).mockResolvedValue({
        id: "c1",
        schoolId: mockSchoolId
      } as any)

      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: "teacher-1",
        schoolId: mockSchoolId
      } as any)

      const mockUpdated = { id: "c1", section: "B", homeroomTeacherIds: ["teacher-1"] }
      vi.mocked(prisma.classroom.update).mockResolvedValue(mockUpdated as any)

      const result = await updateClassroom("c1", { homeroomTeacherIds: ["teacher-1"] })

      expect(result).toEqual({ success: true, data: mockUpdated })
    })

    it("should reject homeroom teacher from different school on update", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.classroom.findUnique).mockResolvedValue({
        id: "c1",
        schoolId: mockSchoolId
      } as any)

      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: "teacher-external",
        schoolId: "different-school-id"
      } as any)

      const result = await updateClassroom("c1", { homeroomTeacherIds: ["teacher-external"] })

      expect(result).toEqual({ success: false, error: "L'enseignant sélectionné n'appartient pas à cette école" })
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
