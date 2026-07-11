import { describe, it, expect, beforeEach, vi } from "vitest"
import { listSchools, createSchool, getSchoolStats } from "./school"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Mock auth
vi.mock("@/lib/auth")

// Mock permissions
vi.mock("@/lib/permissions", () => ({
  can: vi.fn((role: string, action: string, resource: string) => {
    // PLATFORM_SUPER_ADMIN has full access to everything
    if (role === "PLATFORM_SUPER_ADMIN") return true
    // Other roles have no access to "school" resource
    if (resource === "school") return false
    return true
  }),
}))

const mockSchoolId = "school-1"

describe("school actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSession = (role: string) => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-1",
        email: "test@test.com",
        role,
        schoolId: mockSchoolId,
      },
    } as any)
  }

  describe("listSchools", () => {
    it("should allow PLATFORM_SUPER_ADMIN to list all schools", async () => {
      mockSession("PLATFORM_SUPER_ADMIN")
      
      vi.mocked(prisma.school.findMany as any).mockResolvedValue([
        {
          id: "school-1",
          name: "Sekoly Test",
          address: "Amboavory",
          createdAt: new Date(),
          _count: {
            students: 100,
            teachers: 20,
            classrooms: 10,
          },
        }
      ] as any)
      
      const result = await listSchools()
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0].name).toBe("Sekoly Test")
        expect(result.data[0].studentCount).toBe(100)
      }
    })

    it("should deny access for non-PLATFORM_SUPER_ADMIN roles", async () => {
      mockSession("SCHOOL_ADMIN")
      
      vi.mocked(prisma.school.findMany as any).mockResolvedValue([])
      
      const result = await listSchools()
      
      expect(result.success).toBe(false)
    })
  })

  describe("createSchool", () => {
    it("should allow PLATFORM_SUPER_ADMIN to create a school with admin", async () => {
      mockSession("PLATFORM_SUPER_ADMIN")
      
      vi.mocked(prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          school: {
            create: vi.fn().mockResolvedValue({
              id: "new-school-id",
              name: "New School",
              address: "Test Address",
            }),
          },
          user: {
            create: vi.fn().mockResolvedValue({
              id: "new-admin-id",
              email: "admin@newschool.mg",
            }),
          },
        })
      })
      
      const result = await createSchool({
        name: "New School",
        address: "Test Address",
        adminFirstName: "Admin",
        adminLastName: "User",
        adminEmail: "admin@newschool.mg",
      })
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.schoolId).toBe("new-school-id")
        expect(result.data.tempPassword).toBeDefined()
        expect(result.data.tempPassword).toHaveLength(16)
      }
    })

    it("should deny access for non-PLATFORM_SUPER_ADMIN roles", async () => {
      mockSession("SCHOOL_ADMIN")
      
      const result = await createSchool({
        name: "New School",
        address: "Test Address",
        adminFirstName: "Admin",
        adminLastName: "User",
        adminEmail: "admin@newschool.mg",
      })
      
      expect(result.success).toBe(false)
    })

    it("should validate required fields", async () => {
      mockSession("PLATFORM_SUPER_ADMIN")
      
      const result = await createSchool({
        name: "",
        address: "",
        adminFirstName: "",
        adminLastName: "",
        adminEmail: "invalid-email",
      })
      
      expect(result.success).toBe(false)
    })
  })

  describe("getSchoolStats", () => {
    it("should allow PLATFORM_SUPER_ADMIN to get school stats", async () => {
      mockSession("PLATFORM_SUPER_ADMIN")
      
      vi.mocked(prisma.school.findUnique as any).mockResolvedValue({
        id: mockSchoolId,
        name: "Sekoly Test",
        _count: {
          students: 100,
          teachers: 20,
          classrooms: 10,
        },
      } as any)
      
      const result = await getSchoolStats(mockSchoolId)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.studentCount).toBe(100)
        expect(result.data.teacherCount).toBe(20)
        expect(result.data.classroomCount).toBe(10)
      }
    })

    it("should return error for non-existent school", async () => {
      mockSession("PLATFORM_SUPER_ADMIN")
      
      vi.mocked(prisma.school.findUnique as any).mockResolvedValue(null)
      
      const result = await getSchoolStats("non-existent-id")
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("School not found")
      }
    })

    it("should deny access for non-PLATFORM_SUPER_ADMIN roles", async () => {
      mockSession("SCHOOL_ADMIN")
      
      const result = await getSchoolStats(mockSchoolId)
      
      expect(result.success).toBe(false)
    })
  })
})
