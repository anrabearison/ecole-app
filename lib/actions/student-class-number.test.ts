import { describe, it, expect, beforeEach, vi } from "vitest"
import { generateClassNumbers } from "./student"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

describe("generateClassNumbers action", () => {
  const schoolId = "school-1"
  const classroomId = "classroom-1"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-1",
        role: "SCHOOL_ADMIN",
        schoolId,
      },
    } as any)
  })

  it("should return Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    const result = await generateClassNumbers(classroomId)
    expect(result).toEqual({ success: false, error: "Unauthorized" })
  })

  it("should return Forbidden when role is STUDENT", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "student-user",
        role: "STUDENT",
        schoolId,
      },
    } as any)
    const result = await generateClassNumbers(classroomId)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain("Forbidden")
    }
  })

  it("should sort unassigned students alphabetically and assign numbers starting at 1", async () => {
    vi.mocked(prisma.classroom.findUnique).mockResolvedValue({
      id: classroomId,
      schoolId,
      schoolYear: "2025-2026",
    } as any)

    // Mock 3 unassigned students in random order
    const mockEnrollments = [
      { id: "e1", studentId: "s1", classNumber: null, student: { id: "s1", lastName: "Dupont", firstName: "Alain", classNumber: null } },
      { id: "e2", studentId: "s2", classNumber: null, student: { id: "s2", lastName: "Bernard", firstName: "Sophie", classNumber: null } },
      { id: "e3", studentId: "s3", classNumber: null, student: { id: "s3", lastName: "Adam", firstName: "Charles", classNumber: null } },
    ]

    vi.mocked(prisma.enrollment.findMany).mockResolvedValue(mockEnrollments as any)
    vi.mocked(prisma.$transaction).mockResolvedValue([] as any)

    const result = await generateClassNumbers(classroomId)

    expect(result).toEqual({ success: true, data: { updatedCount: 3 } })
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it("should keep existing assigned numbers and assign next sequential numbers to new students", async () => {
    vi.mocked(prisma.classroom.findUnique).mockResolvedValue({
      id: classroomId,
      schoolId,
      schoolYear: "2025-2026",
    } as any)

    // s1 (Adam) has 1, s2 (Bernard) has 2, s3 (Dupont) has 3. s4 (Bataille - new student) is null.
    const mockEnrollments = [
      { id: "e1", studentId: "s1", classNumber: 1, student: { id: "s1", lastName: "Adam", firstName: "Charles", classNumber: 1 } },
      { id: "e2", studentId: "s2", classNumber: 2, student: { id: "s2", lastName: "Bernard", firstName: "Sophie", classNumber: 2 } },
      { id: "e3", studentId: "s3", classNumber: 3, student: { id: "s3", lastName: "Dupont", firstName: "Alain", classNumber: 3 } },
      { id: "e4", studentId: "s4", classNumber: null, student: { id: "s4", lastName: "Bataille", firstName: "Pierre", classNumber: null } },
    ]

    vi.mocked(prisma.enrollment.findMany).mockResolvedValue(mockEnrollments as any)
    vi.mocked(prisma.$transaction).mockResolvedValue([] as any)

    const result = await generateClassNumbers(classroomId)

    expect(result).toEqual({ success: true, data: { updatedCount: 1 } })
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})
