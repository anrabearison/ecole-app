import { describe, it, expect, beforeEach, vi } from "vitest"
import { listStudents, createStudent, updateStudent, deleteStudent } from "./student"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

describe("Student Server Actions", () => {
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

  describe("listStudents", () => {
    it("should return students filtered by schoolId", async () => {
      mockSession()
      
      const mockData = [
        { 
          id: "s1", 
          firstName: "Jean",
          lastName: "Rakoto",
          user: { id: "u1", email: "jean@test.com", active: true },
          classroom: null,
          schoolId: mockSchoolId,
          createdAt: new Date()
        }
      ]
      
      vi.mocked(prisma.student.findMany).mockResolvedValue(mockData as any)

      const result = await listStudents()

      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: mockSchoolId }
        })
      )
      expect(result).toEqual({ success: true, data: mockData })
    })
  })

  describe("createStudent", () => {
    it("should create a student with valid data", async () => {
      mockSession("SCHOOL_ADMIN")
      
      const input = {
        firstName: "Jean",
        lastName: "Rakoto",
        email: "jean@test.com",
        classroomId: "classroom-1"
      }
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.classroom.findUnique).mockResolvedValue({
        id: "classroom-1",
        schoolId: mockSchoolId,
        schoolYear: "2025-2026"
      } as any)

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          user: {
            create: vi.fn().mockResolvedValue({ id: "u1", email: input.email, active: true }),
          },
          student: {
            create: vi.fn().mockResolvedValue({
              id: "s1",
              firstName: input.firstName,
              lastName: input.lastName,
              user: { id: "u1", email: input.email, active: true },
              classroom: null,
              schoolId: mockSchoolId,
              createdAt: new Date()
            }),
          },
          enrollment: {
            create: vi.fn().mockResolvedValue({}),
          },
        }
        return callback(tx)
      })

      const result = await createStudent(input)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty('student')
        expect(result.data).toHaveProperty('temporaryPassword')
      }
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it("should return error for invalid data without calling Prisma", async () => {
      mockSession("SCHOOL_ADMIN")
      
      // Invalid data: firstName is empty
      const input = { firstName: "", lastName: "Rakoto", email: "jean@test.com" } as any
      
      const result = await createStudent(input)
      
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

      const result = await createStudent(input)
      
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
      
      const result = await createStudent(input)
      
      expect(result).toEqual({ success: false, error: "Forbidden" })
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe("updateStudent", () => {
    it("should successfully update with valid data", async () => {
      mockSession("SCHOOL_ADMIN")
      
      vi.mocked(prisma.student.findUnique).mockResolvedValue({
        id: "s1",
        schoolId: mockSchoolId,
        userId: "u1",
        classroom: null,
      } as any)
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          user: {
            update: vi.fn().mockResolvedValue({}),
          },
          student: {
            update: vi.fn().mockResolvedValue({
              id: "s1",
              firstName: "Jean",
              lastName: "Rakoto",
              user: { id: "u1", email: "jean@test.com", active: true },
              classroom: null,
              schoolId: mockSchoolId,
              createdAt: new Date()
            }),
          },
          enrollment: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({}),
          },
        }
        return callback(tx)
      })
      
      const result = await updateStudent("s1", { firstName: "Jean" })
      
      expect(result.success).toBe(true)
    })

    it("should return error for invalid data without calling Prisma", async () => {
      mockSession("SCHOOL_ADMIN")
      const result = await updateStudent("s1", { firstName: "" })
      expect(result.success).toBe(false)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("should return Forbidden for unauthorized role", async () => {
      mockSession("TEACHER")
      const result = await updateStudent("s1", { firstName: "Jean" })
      expect(result.success).toBe(false)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe("deleteStudent", () => {
    it("should successfully deactivate (not delete) a student", async () => {
      mockSession("SCHOOL_ADMIN")
      
      vi.mocked(prisma.student.findUnique).mockResolvedValue({
        id: "s1",
        schoolId: mockSchoolId,
        userId: "u1",
        user: { id: "u1" },
      } as any)
      
      vi.mocked(prisma.user.update).mockResolvedValue({ active: false } as any)
      
      const result = await deleteStudent("s1")
      
      expect(result.success).toBe(true)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { active: false }
      })
    })

    it("should return Forbidden for unauthorized role", async () => {
      mockSession("TEACHER")
      const result = await deleteStudent("s1")
      expect(result.success).toBe(false)
      expect(prisma.user.update).not.toHaveBeenCalled()
    })
  })
})
