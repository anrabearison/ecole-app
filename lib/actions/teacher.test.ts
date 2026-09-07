import { describe, it, expect, beforeEach, vi } from "vitest"
import { listTeachers, createTeacher, updateTeacher, deleteTeacher, getClassroomsForTeacherFilter } from "./teacher"
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

  // ============================================================
  // listTeachers — existing tests (non-regression)
  // ============================================================
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
          registrationNumber: "T-2025-001",
          nationalIdNumber: "123456789012",
          sex: "MALE",
          createdAt: new Date()
        }
      ]

      vi.mocked(prisma.teacher.findMany).mockResolvedValue(mockData as any)
      vi.mocked(prisma.teacher.count).mockResolvedValue(1)

      const result = await listTeachers()

      expect(prisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: mockSchoolId },
          orderBy: [
            { lastName: "asc" },
            { firstName: "asc" }
          ]
        })
      )
      expect(result).toEqual({
        success: true,
        data: mockData,
        pagination: {
          total: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1
        }
      })
    })

    it("should filter teachers by active status", async () => {
      mockSession()

      vi.mocked(prisma.teacher.findMany).mockResolvedValue([] as any)
      vi.mocked(prisma.teacher.count).mockResolvedValue(0)

      await listTeachers({ active: true })

      expect(prisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: mockSchoolId, user: { active: true } }
        })
      )
    })

    it("should return Unauthorized when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await listTeachers()

      expect(result).toEqual({ success: false, error: "Unauthorized" })
      expect(prisma.teacher.findMany).not.toHaveBeenCalled()
    })

    it("should return Forbidden for STUDENT role", async () => {
      mockSession("STUDENT")

      const result = await listTeachers()

      expect(result).toEqual({ success: false, error: "Forbidden" })
      expect(prisma.teacher.findMany).not.toHaveBeenCalled()
    })

    it("should return error when schoolId is missing", async () => {
      mockSession("SCHOOL_ADMIN", null)

      const result = await listTeachers()

      expect(result).toEqual({ success: false, error: "School ID is required" })
      expect(prisma.teacher.findMany).not.toHaveBeenCalled()
    })

    // ---------------------------------------------------------------
    // NEW: classroomId filter
    // ---------------------------------------------------------------
    it("should filter teachers by classroomId via subjects relation", async () => {
      mockSession()

      const classroomId = "classroom-abc"
      vi.mocked(prisma.teacher.findMany).mockResolvedValue([] as any)
      vi.mocked(prisma.teacher.count).mockResolvedValue(0)

      await listTeachers({ classroomId })

      expect(prisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            schoolId: mockSchoolId,
            subjects: { some: { classroomId } },
          }
        })
      )
    })

    it("should NOT include subjects filter when classroomId is undefined", async () => {
      mockSession()

      vi.mocked(prisma.teacher.findMany).mockResolvedValue([] as any)
      vi.mocked(prisma.teacher.count).mockResolvedValue(0)

      await listTeachers()

      expect(prisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: mockSchoolId }
        })
      )

      const callArg = vi.mocked(prisma.teacher.findMany).mock.calls[0][0] as any
      expect(callArg?.where?.subjects).toBeUndefined()
    })

    it("should combine classroomId filter with active status filter", async () => {
      mockSession()

      const classroomId = "classroom-xyz"
      vi.mocked(prisma.teacher.findMany).mockResolvedValue([] as any)
      vi.mocked(prisma.teacher.count).mockResolvedValue(0)

      await listTeachers({ classroomId, active: false })

      expect(prisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            schoolId: mockSchoolId,
            subjects: { some: { classroomId } },
            user: { active: false },
          }
        })
      )
    })

    it("should combine classroomId filter with search filter", async () => {
      mockSession()

      const classroomId = "classroom-xyz"
      vi.mocked(prisma.teacher.findMany).mockResolvedValue([] as any)
      vi.mocked(prisma.teacher.count).mockResolvedValue(0)

      await listTeachers({ classroomId, search: "Rakoto" })

      const callArg = vi.mocked(prisma.teacher.findMany).mock.calls[0][0] as any
      expect(callArg.where.subjects).toEqual({ some: { classroomId } })
      expect(callArg.where.OR).toBeDefined()
    })

    it("should return correct pagination data with classroomId filter", async () => {
      mockSession()

      const classroomId = "classroom-abc"
      const mockData = [
        {
          id: "t1", firstName: "Jean", lastName: "Rakoto",
          user: { id: "u1", email: "jean@test.com", active: true },
          schoolId: mockSchoolId, _count: { subjects: 1 },
          nationalIdNumber: "123456789012", sex: "MALE", createdAt: new Date()
        }
      ]

      vi.mocked(prisma.teacher.findMany).mockResolvedValue(mockData as any)
      vi.mocked(prisma.teacher.count).mockResolvedValue(1)

      const result = await listTeachers({ classroomId, page: 1, pageSize: 10 })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.pagination).toEqual({
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        })
        expect(result.data).toHaveLength(1)
      }
    })

    it("should return empty list when no teachers match the classroom filter", async () => {
      mockSession()

      vi.mocked(prisma.teacher.findMany).mockResolvedValue([] as any)
      vi.mocked(prisma.teacher.count).mockResolvedValue(0)

      const result = await listTeachers({ classroomId: "classroom-empty" })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(0)
        expect(result.pagination?.total).toBe(0)
        expect(result.pagination?.totalPages).toBe(0)
      }
    })
  })

  // ============================================================
  // getClassroomsForTeacherFilter — new feature tests
  // ============================================================
  describe("getClassroomsForTeacherFilter", () => {
    it("should return classrooms with teacher assignments, sorted by schoolGrade.order", async () => {
      mockSession()

      // Prisma returns them un-sorted (simulating DB order)
      vi.mocked(prisma.classroom.findMany).mockResolvedValue([
        { id: "c3", section: "A", schoolYear: "2023-2024", schoolGrade: { name: "6ème", order: 1 } },
        { id: "c2", section: "B", schoolYear: "2024-2025", schoolGrade: { name: "5ème", order: 2 } },
        { id: "c1", section: "A", schoolYear: "2024-2025", schoolGrade: { name: "6ème", order: 1 } },
      ] as any)

      const result = await getClassroomsForTeacherFilter()

      expect(result.success).toBe(true)
      if (result.success) {
        // 2024-2025 classrooms should come before 2023-2024
        expect(result.data[0].schoolYear).toBe("2024-2025")
        // Within 2024-2025: order 1 (6ème A) before order 2 (5ème B)
        expect(result.data[0].name).toBe("6ème A")
        expect(result.data[1].name).toBe("5ème B")
        expect(result.data[2].schoolYear).toBe("2023-2024")
      }
    })

    it("should query only classrooms with at least one teacher assignment", async () => {
      mockSession()

      vi.mocked(prisma.classroom.findMany).mockResolvedValue([])

      await getClassroomsForTeacherFilter()

      expect(prisma.classroom.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            schoolId: mockSchoolId,
            teacherSubjects: { some: {} },
          }
        })
      )
    })

    it("should format classroom names as 'gradeName section'", async () => {
      mockSession()

      vi.mocked(prisma.classroom.findMany).mockResolvedValue([
        {
          id: "c1", section: "1", schoolYear: "2024-2025",
          schoolGrade: { name: "Terminale", order: 7 },
        }
      ] as any)

      const result = await getClassroomsForTeacherFilter()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data[0]).toEqual({
          id: "c1",
          name: "Terminale 1",
          schoolYear: "2024-2025",
        })
      }
    })

    it("should return empty array when no classrooms have teacher assignments", async () => {
      mockSession()

      vi.mocked(prisma.classroom.findMany).mockResolvedValue([])

      const result = await getClassroomsForTeacherFilter()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual([])
      }
    })

    it("should return Unauthorized when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await getClassroomsForTeacherFilter()

      expect(result).toEqual({ success: false, error: "Unauthorized" })
      expect(prisma.classroom.findMany).not.toHaveBeenCalled()
    })

    it("should return error when schoolId is missing", async () => {
      mockSession("SCHOOL_ADMIN", null)

      const result = await getClassroomsForTeacherFilter()

      expect(result).toEqual({ success: false, error: "School ID is required" })
      expect(prisma.classroom.findMany).not.toHaveBeenCalled()
    })

    it("should return error message when Prisma throws", async () => {
      mockSession()

      vi.mocked(prisma.classroom.findMany).mockRejectedValue(new Error("DB connection failed"))

      const result = await getClassroomsForTeacherFilter()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Erreur lors du chargement des classes")
      }
    })

    it("should sort classrooms with equal grade order alphabetically by section", async () => {
      mockSession()

      // Two sections of the same grade
      vi.mocked(prisma.classroom.findMany).mockResolvedValue([
        { id: "c2", section: "B", schoolYear: "2024-2025", schoolGrade: { name: "6ème", order: 1 } },
        { id: "c1", section: "A", schoolYear: "2024-2025", schoolGrade: { name: "6ème", order: 1 } },
      ] as any)

      const result = await getClassroomsForTeacherFilter()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data[0].name).toBe("6ème A")
        expect(result.data[1].name).toBe("6ème B")
      }
    })
  })

  // ============================================================
  // createTeacher — existing tests (non-regression)
  // ============================================================
  describe("createTeacher", () => {
    it("should create a teacher with valid data", async () => {
      mockSession("SCHOOL_ADMIN")
      
      const input = {
        firstName: "Jean",
        lastName: "Rakoto",
        email: "jean@test.com",
        phone: "+261341000000",
        contractType: "FONCTIONNAIRE" as const,
        registrationNumber: "T-2025-001",
        nationalIdNumber: "123456789012",
        sex: "MALE" as const,
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
        nationalIdNumber: "123456789012",
        sex: "MALE" as const,
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1" } as any)

      const result = await createTeacher(input)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Cet email est déjà utilisé par un autre compte")
      }
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("should return error for missing required fields (nationalIdNumber, sex)", async () => {
      mockSession("SCHOOL_ADMIN")

      const input = {
        firstName: "Jean",
        lastName: "Rakoto",
        email: "jean@test.com",
      } as any

      const result = await createTeacher(input)

      expect(result.success).toBe(false)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("should return Forbidden for unauthorized role (e.g. TEACHER)", async () => {
      mockSession("TEACHER")
      
      const input = {
        firstName: "Jean",
        lastName: "Rakoto",
        email: "jean@test.com",
        nationalIdNumber: "123456789012",
        sex: "MALE" as const,
      }

      const result = await createTeacher(input)
      
      expect(result).toEqual({ success: false, error: "Forbidden" })
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("should use default password 'Init12345' for new teachers", async () => {
      mockSession("SCHOOL_ADMIN")
      
      const input = {
        firstName: "Jean",
        lastName: "Rakoto",
        email: "jean@test.com",
        nationalIdNumber: "123456789012",
        sex: "MALE" as const,
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
        expect(result.data).toHaveProperty('temporaryPassword')
        expect(result.data.temporaryPassword).toBe("Init12345")
      }
    })

    it("should create teacher without firstName (optional field)", async () => {
      mockSession("SCHOOL_ADMIN")
      
      const input = {
        firstName: "",
        lastName: "Rakoto",
        email: "jean@test.com",
        nationalIdNumber: "123456789012",
        sex: "MALE" as const,
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
              firstName: null,
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
        expect(result.data.teacher.firstName).toBe(null)
      }
    })

    it("should use explicit Prisma relations for school connection", async () => {
      mockSession("SCHOOL_ADMIN")
      
      const input = {
        firstName: "Jean",
        lastName: "Rakoto",
        email: "jean@test.com",
        nationalIdNumber: "123456789012",
        sex: "MALE" as const,
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
      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })

  // ============================================================
  // updateTeacher — existing tests (non-regression)
  // ============================================================
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
      
      const result = await updateTeacher("t1", { firstName: "Jean", phone: "+261341111111" })
      
      expect(result.success).toBe(true)
    })

    it("should return error for invalid data without calling Prisma", async () => {
      mockSession("SCHOOL_ADMIN")
      const result = await updateTeacher("t1", { firstName: "" } as any)
      expect(result.success).toBe(false)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("should return Forbidden for unauthorized role", async () => {
      mockSession("TEACHER")
      const result = await updateTeacher("t1", { firstName: "Jean" })
      expect(result.success).toBe(false)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("should update teacher without firstName (optional field)", async () => {
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
              firstName: null,
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
      
      const result = await updateTeacher("t1", { 
        firstName: "", 
        lastName: "Rakoto",
        registrationNumber: "T-2025-001",
        nationalIdNumber: "123456789012",
        sex: "MALE" as const
      })
      
      expect(result.success).toBe(true)
    })
  })

  // ============================================================
  // deleteTeacher — existing tests (non-regression)
  // ============================================================
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
