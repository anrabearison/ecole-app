import { describe, it, expect, beforeEach, vi } from "vitest"
import { listTeachers, createTeacher, updateTeacher, deleteTeacher } from "./teacher"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

describe("Teacher Server Actions", () => {
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

  describe("listTeachers", () => {
    it("should return teachers filtered by schoolId", async () => {
      mockSession()
      
      const mockData = [
        { 
          id: "t1", 
          firstName: "Jean",
          lastName: "Rakoto",
          user: { id: "u1", email: "jean@test.com", active: true },
          schoolId: mockSchoolId,
          _count: { subjects: 2 },
          createdAt: new Date()
        }
      ]
      
      vi.mocked(prisma.teacher.findMany).mockResolvedValue(mockData as any)

      const result = await listTeachers()

      expect(prisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: mockSchoolId }
        })
      )
      expect(result).toEqual({ success: true, data: mockData })
    })
  })

  describe("createTeacher", () => {
    it("should create a teacher with valid data", async () => {
      mockSession("SCHOOL_ADMIN")
      
      const input = {
        firstName: "Jean",
        lastName: "Rakoto",
        email: "jean@test.com",
      }
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          user: {
            create: vi.fn().mockResolvedValue({ id: "u1", email: input.email, active: true }),
          },
          teacher: {
            create: vi.fn().mockResolvedValue({
              id: "t1",
              firstName: input.firstName,
              lastName: input.lastName,
              user: { id: "u1", email: input.email, active: true },
              schoolId: mockSchoolId,
              _count: { subjects: 0 },
              createdAt: new Date()
            }),
          },
        }
        return callback(tx)
      })

      const result = await createTeacher(input)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty('teacher')
        expect(result.data).toHaveProperty('temporaryPassword')
      }
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it("should return error for invalid data without calling Prisma", async () => {
      mockSession("SCHOOL_ADMIN")
      
      const input = { firstName: "", lastName: "Rakoto", email: "jean@test.com" } as any
      
      const result = await createTeacher(input)
      
      expect(result.success).toBe(false)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("should return error for duplicate email", async () => {
      mockSession("SCHOOL_ADMIN")
      
      const input = {
        firstName: "Jean",
        lastName: "Rakoto",
        email: "existing@test.com",
      }
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1" } as any)

      const result = await createTeacher(input)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Email already exists")
      }
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("should return Forbidden for unauthorized role (e.g. TEACHER)", async () => {
      mockSession("TEACHER")
      
      const input = {
        firstName: "Jean",
        lastName: "Rakoto",
        email: "jean@test.com",
      }
      
      const result = await createTeacher(input)
      
      expect(result).toEqual({ success: false, error: "Forbidden" })
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe("updateTeacher", () => {
    it("should successfully update with valid data", async () => {
      mockSession("SCHOOL_ADMIN")
      
      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: "t1",
        schoolId: mockSchoolId,
        userId: "u1",
      } as any)
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          user: {
            update: vi.fn().mockResolvedValue({}),
          },
          teacher: {
            update: vi.fn().mockResolvedValue({
              id: "t1",
              firstName: "Jean",
              lastName: "Rakoto",
              user: { id: "u1", email: "jean@test.com", active: true },
              schoolId: mockSchoolId,
              _count: { subjects: 0 },
              createdAt: new Date()
            }),
          },
        }
        return callback(tx)
      })
      
      const result = await updateTeacher("t1", { firstName: "Jean" })
      
      expect(result.success).toBe(true)
    })

    it("should return error for invalid data without calling Prisma", async () => {
      mockSession("SCHOOL_ADMIN")
      const result = await updateTeacher("t1", { firstName: "" })
      expect(result.success).toBe(false)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("should return Forbidden for unauthorized role", async () => {
      mockSession("TEACHER")
      const result = await updateTeacher("t1", { firstName: "Jean" })
      expect(result.success).toBe(false)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe("deleteTeacher", () => {
    it("should successfully deactivate (not delete) a teacher", async () => {
      mockSession("SCHOOL_ADMIN")
      
      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: "t1",
        schoolId: mockSchoolId,
        userId: "u1",
        user: { id: "u1" },
      } as any)
      
      vi.mocked(prisma.user.update).mockResolvedValue({ active: false } as any)
      
      const result = await deleteTeacher("t1")
      
      expect(result.success).toBe(true)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { active: false }
      })
    })

    it("should return Forbidden for unauthorized role", async () => {
      mockSession("TEACHER")
      const result = await deleteTeacher("t1")
      expect(result.success).toBe(false)
      expect(prisma.user.update).not.toHaveBeenCalled()
    })
  })
})
