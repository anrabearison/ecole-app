import { describe, it, expect, beforeEach, vi } from "vitest"
import { getProfile, updateProfile, updatePassword } from "./profile"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

vi.mock("@/lib/auth")
vi.mock("bcryptjs")

function mockSession(userId = "user-1", role = "TEACHER") {
  vi.mocked(auth).mockResolvedValue({
    user: {
      id: userId,
      email: "user@example.com",
      role: role as any,
      schoolId: "school-1",
      teacherId: "teacher-1",
      studentId: null,
    },
    expires: "9999-12-31T23:59:59.999Z",
  } as any)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Profile Server Actions", () => {
  describe("getProfile", () => {
    it("should return user profile if authenticated", async () => {
      mockSession("user-1", "TEACHER")

      const mockUserData = {
        id: "user-1",
        email: "user@example.com",
        role: "TEACHER",
        active: true,
        createdAt: new Date(),
        school: { name: "École Test" },
        teacher: {
          id: "teacher-1",
          firstName: "Jean",
          lastName: "Dupont",
          phone: "0340000000",
          contractType: "FONCTIONNAIRE",
          registrationNumber: "MAT-123",
          nationalIdNumber: "101202303404",
        },
        student: null,
      }

      vi.mocked(prisma.user.findUnique as any).mockResolvedValue(mockUserData as any)

      const result = await getProfile()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe("user@example.com")
        expect(result.data.teacher?.firstName).toBe("Jean")
        expect(result.data.schoolName).toBe("École Test")
      }
    })

    it("should fail if user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await getProfile()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Non authentifié")
      }
    })
  })

  describe("updateProfile", () => {
    it("should update profile successfully", async () => {
      mockSession("user-1", "TEACHER")

      vi.mocked(prisma.user.findUnique as any).mockResolvedValue({
        id: "user-1",
        email: "old@example.com",
        teacher: { id: "teacher-1" },
      } as any)

      vi.mocked(prisma.$transaction as any).mockImplementation(async (cb: any) => {
        return cb({
          user: { update: vi.fn().mockResolvedValue({}) },
          teacher: { update: vi.fn().mockResolvedValue({}) },
          student: { update: vi.fn().mockResolvedValue({}) },
        })
      })

      const result = await updateProfile({
        email: "new@example.com",
        firstName: "Pierre",
        lastName: "Durand",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message).toBe("Profil mis à jour avec succès")
      }
    })
  })

  describe("updatePassword", () => {
    it("should reject if current password is incorrect", async () => {
      mockSession("user-1", "TEACHER")

      vi.mocked(prisma.user.findUnique as any).mockResolvedValue({
        id: "user-1",
        passwordHash: "hashed-old-pass",
      } as any)

      vi.mocked(bcrypt.compare as any).mockResolvedValue(false)

      const result = await updatePassword({
        currentPassword: "wrongpassword",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Le mot de passe actuel est incorrect")
      }
    })

    it("should update password if current password is valid", async () => {
      mockSession("user-1", "TEACHER")

      vi.mocked(prisma.user.findUnique as any).mockResolvedValue({
        id: "user-1",
        passwordHash: "hashed-old-pass",
      } as any)

      vi.mocked(bcrypt.compare as any).mockResolvedValue(true)
      vi.mocked(bcrypt.hash as any).mockResolvedValue("hashed-new-pass")
      vi.mocked(prisma.user.update as any).mockResolvedValue({} as any)

      const result = await updatePassword({
        currentPassword: "correctpassword",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message).toBe("Mot de passe modifié avec succès")
      }
    })
  })
})
