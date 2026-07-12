import { describe, it, expect, vi, beforeEach } from "vitest"
import { listSubjects, createSubject, updateSubject, deleteSubject } from "./subject"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

vi.mock("@/lib/auth")

describe("Subject Actions", () => {
  const mockSession = {
    user: {
      id: "admin-1",
      email: "admin@test.com",
      role: "SCHOOL_ADMIN",
      schoolId: "school-1",
    },
    expires: "2050-01-01T00:00:00.000Z",
  }

  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockSession as any)
  })

  describe("listSubjects", () => {
    it("should return subjects for the school", async () => {
      const mockSubjects = [
        { id: "1", name: "Mathématiques", schoolId: "school-1" },
        { id: "2", name: "Français", schoolId: "school-1" },
      ]

      vi.mocked(prisma.subject.findMany).mockResolvedValue(mockSubjects as any)

      const result = await listSubjects()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(2)
        expect(result.data[0].name).toBe("Mathématiques")
      }
      expect(prisma.subject.findMany).toHaveBeenCalledWith({
        where: { schoolId: "school-1" },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    })

    it("should return unauthorized if not logged in", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      const result = await listSubjects()
      expect(result.success).toBe(false)
    })
  })

  describe("createSubject", () => {
    it("should create a new subject", async () => {
      vi.mocked(prisma.subject.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.subject.create).mockResolvedValue({
        id: "new-subject",
        name: "Histoire",
        schoolId: "school-1",
      } as any)

      const result = await createSubject({ name: "Histoire", coefficient: 1.0 })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("Histoire")
      }
      expect(prisma.subject.create).toHaveBeenCalledWith({
        data: {
          name: "Histoire",
          coefficient: 1.0,
          schoolId: "school-1",
        },
      })
    })

    it("should return error if name already exists", async () => {
      vi.mocked(prisma.subject.findFirst).mockResolvedValue({
        id: "existing",
        name: "Histoire",
        schoolId: "school-1",
      } as any)

      const result = await createSubject({ name: "Histoire", coefficient: 1.0 })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Une matière avec ce nom existe déjà")
      }
      expect(prisma.subject.create).not.toHaveBeenCalled()
    })
  })

  describe("updateSubject", () => {
    it("should update an existing subject", async () => {
      vi.mocked(prisma.subject.findUnique).mockResolvedValue({
        id: "subject-1",
        name: "Maths",
        schoolId: "school-1",
      } as any)
      vi.mocked(prisma.subject.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.subject.update).mockResolvedValue({
        id: "subject-1",
        name: "Mathématiques Avancées",
        schoolId: "school-1",
      } as any)

      const result = await updateSubject("subject-1", { name: "Mathématiques Avancées", coefficient: 1.0 })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("Mathématiques Avancées")
      }
      expect(prisma.subject.update).toHaveBeenCalledWith({
        where: { id: "subject-1" },
        data: { name: "Mathématiques Avancées", coefficient: 1.0 },
      })
    })

    it("should fail if another subject has the same name", async () => {
      vi.mocked(prisma.subject.findUnique).mockResolvedValue({
        id: "subject-1",
        name: "Maths",
        schoolId: "school-1",
      } as any)
      vi.mocked(prisma.subject.findFirst).mockResolvedValue({
        id: "subject-2",
        name: "Histoire",
        schoolId: "school-1",
      } as any)

      const result = await updateSubject("subject-1", { name: "Histoire", coefficient: 1.0 })

      expect(result.success).toBe(false)
      expect(prisma.subject.update).not.toHaveBeenCalled()
    })
  })

  describe("deleteSubject", () => {
    it("should delete subject if it belongs to school", async () => {
      vi.mocked(prisma.subject.findUnique).mockResolvedValue({
        id: "subject-1",
        name: "Maths",
        schoolId: "school-1",
      } as any)

      vi.mocked(prisma.subject.delete).mockResolvedValue({} as any)

      const result = await deleteSubject("subject-1")

      expect(result.success).toBe(true)
      expect(prisma.subject.delete).toHaveBeenCalledWith({
        where: { id: "subject-1" },
      })
    })

    it("should fail if subject belongs to another school", async () => {
      vi.mocked(prisma.subject.findUnique).mockResolvedValue({
        id: "subject-1",
        name: "Maths",
        schoolId: "other-school",
      } as any)

      const result = await deleteSubject("subject-1")

      expect(result.success).toBe(false)
      expect(prisma.subject.delete).not.toHaveBeenCalled()
    })
  })
})
