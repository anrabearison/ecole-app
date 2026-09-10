import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  listSchools,
  createSchool,
  getSchoolStats,
  getSchoolScheduleSettings,
  updateSchoolScheduleSettings,
  getSchoolLogo,
  updateSchoolLogo,
  deleteSchoolLogo,
} from "./school"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Mock auth
vi.mock("@/lib/auth")

// Mock permissions
vi.mock("@/lib/permissions", () => ({
  can: vi.fn((role: string, action: string, resource: string) => {
    // PLATFORM_SUPER_ADMIN has full access to everything
    if (role === "PLATFORM_SUPER_ADMIN") return true
    // SCHOOL_ADMIN can update their school settings
    if (role === "SCHOOL_ADMIN" && resource === "school" && action === "update") return true
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

  describe("getSchoolScheduleSettings", () => {
    it("should return schedule settings for the user's school", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.school.findUnique as any).mockResolvedValue({
        scheduleStartTime: "07:00",
        morningEndTime: "12:00",
        afternoonStartTime: "14:00",
        scheduleEndTime: "18:00",
        slotDurationMinutes: 60,
      } as any)

      const result = await getSchoolScheduleSettings()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.scheduleStartTime).toBe("07:00")
        expect(result.data.morningEndTime).toBe("12:00")
        expect(result.data.afternoonStartTime).toBe("14:00")
        expect(result.data.scheduleEndTime).toBe("18:00")
        expect(result.data.slotDurationMinutes).toBe(60)
      }
    })
  })

  describe("updateSchoolScheduleSettings", () => {
    it("should allow SCHOOL_ADMIN to update schedule settings", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.school.update as any).mockResolvedValue({
        scheduleStartTime: "08:00",
        morningEndTime: "12:00",
        afternoonStartTime: "13:30",
        scheduleEndTime: "17:30",
        slotDurationMinutes: 45,
      } as any)

      const result = await updateSchoolScheduleSettings({
        scheduleStartTime: "08:00",
        morningEndTime: "12:00",
        afternoonStartTime: "13:30",
        scheduleEndTime: "17:30",
        slotDurationMinutes: 45,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.scheduleStartTime).toBe("08:00")
        expect(result.data.slotDurationMinutes).toBe(45)
      }
    })

    it("should reject invalid schedule order where morning end is after afternoon start", async () => {
      mockSession("SCHOOL_ADMIN")

      const result = await updateSchoolScheduleSettings({
        scheduleStartTime: "08:00",
        morningEndTime: "14:00",
        afternoonStartTime: "13:00",
        scheduleEndTime: "18:00",
        slotDurationMinutes: 60,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("Les horaires doivent respecter l'ordre")
      }
    })
  })

  describe("getSchoolLogo", () => {
    it("should return logoUrl for current school", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.school.findUnique as any).mockResolvedValue({
        logoUrl: "data:image/png;base64,fake-logo-data",
      } as any)

      const result = await getSchoolLogo()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.logoUrl).toBe("data:image/png;base64,fake-logo-data")
      }
    })
  })

  describe("updateSchoolLogo", () => {
    it("should allow SCHOOL_ADMIN to update school logo", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.school.update as any).mockResolvedValue({
        logoUrl: "data:image/png;base64,new-logo-data",
      } as any)

      const result = await updateSchoolLogo("data:image/png;base64,new-logo-data")

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.logoUrl).toBe("data:image/png;base64,new-logo-data")
      }
    })

    it("should reject non data:image format", async () => {
      mockSession("SCHOOL_ADMIN")

      const result = await updateSchoolLogo("https://invalid-url.com/logo.png")

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("Format d'image invalide")
      }
    })
  })

  describe("deleteSchoolLogo", () => {
    it("should allow SCHOOL_ADMIN to delete school logo", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.school.update as any).mockResolvedValue({
        logoUrl: null,
      } as any)

      const result = await deleteSchoolLogo()

      expect(result.success).toBe(true)
    })
  })
})
