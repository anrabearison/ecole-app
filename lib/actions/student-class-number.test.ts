import { describe, it, expect, beforeEach, vi } from "vitest"
import { generateClassNumbers } from "./student"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

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

    vi.mocked(prisma.school.findUnique).mockResolvedValue({
      id: schoolId,
      classNumberAlgorithm: "GENDER_SEPARATED",
    } as any)

    // Mock 3 unassigned students in random order
    const mockEnrollments = [
      { id: "e1", studentId: "s1", classNumber: null, student: { id: "s1", lastName: "Dupont", firstName: "Alain", classNumber: null, sex: "MALE" } },
      { id: "e2", studentId: "s2", classNumber: null, student: { id: "s2", lastName: "Bernard", firstName: "Sophie", classNumber: null, sex: "FEMALE" } },
      { id: "e3", studentId: "s3", classNumber: null, student: { id: "s3", lastName: "Adam", firstName: "Charles", classNumber: null, sex: "MALE" } },
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

    vi.mocked(prisma.school.findUnique).mockResolvedValue({
      id: schoolId,
      classNumberAlgorithm: "GENDER_SEPARATED",
    } as any)

    // s1 (Adam) has 1G, s2 (Bernard) has 2F, s3 (Dupont) has 3G. s4 (Bataille - new student) is null.
    const mockEnrollments = [
      { id: "e1", studentId: "s1", classNumber: "1G", student: { id: "s1", lastName: "Adam", firstName: "Charles", classNumber: "1G", sex: "MALE" } },
      { id: "e2", studentId: "s2", classNumber: "2F", student: { id: "s2", lastName: "Bernard", firstName: "Sophie", classNumber: "2F", sex: "FEMALE" } },
      { id: "e3", studentId: "s3", classNumber: "3G", student: { id: "s3", lastName: "Dupont", firstName: "Alain", classNumber: "3G", sex: "MALE" } },
      { id: "e4", studentId: "s4", classNumber: null, student: { id: "s4", lastName: "Bataille", firstName: "Pierre", classNumber: null, sex: "MALE" } },
    ]

    vi.mocked(prisma.enrollment.findMany).mockResolvedValue(mockEnrollments as any)
    vi.mocked(prisma.$transaction).mockResolvedValue([] as any)

    const result = await generateClassNumbers(classroomId)

    expect(result).toEqual({ success: true, data: { updatedCount: 1 } })
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it("should revalidate paths after successful generation", async () => {
    vi.mocked(prisma.classroom.findUnique).mockResolvedValue({
      id: classroomId,
      schoolId,
      schoolYear: "2025-2026",
    } as any)

    vi.mocked(prisma.school.findUnique).mockResolvedValue({
      id: schoolId,
      classNumberAlgorithm: "GENDER_SEPARATED",
    } as any)

    const mockEnrollments = [
      { id: "e1", studentId: "s1", classNumber: null, student: { id: "s1", lastName: "Dupont", firstName: "Alain", classNumber: null, sex: "MALE" } },
    ]

    vi.mocked(prisma.enrollment.findMany).mockResolvedValue(mockEnrollments as any)
    vi.mocked(prisma.$transaction).mockResolvedValue([] as any)

    const result = await generateClassNumbers(classroomId)

    expect(result).toEqual({ success: true, data: { updatedCount: 1 } })
    expect(revalidatePath).toHaveBeenCalledWith("/admin/users/students")
    expect(revalidatePath).toHaveBeenCalledWith(`/admin/classrooms/${classroomId}`)
  })

  it("should use STANDARD algorithm when configured", async () => {
    vi.mocked(prisma.classroom.findUnique).mockResolvedValue({
      id: classroomId,
      schoolId,
      schoolYear: "2025-2026",
    } as any)

    vi.mocked(prisma.school.findUnique).mockResolvedValue({
      id: schoolId,
      classNumberAlgorithm: "STANDARD",
    } as any)

    const mockEnrollments = [
      { id: "e1", studentId: "s1", classNumber: null, student: { id: "s1", lastName: "Dupont", firstName: "Alain", classNumber: null, sex: "MALE" } },
      { id: "e2", studentId: "s2", classNumber: null, student: { id: "s2", lastName: "Bernard", firstName: "Sophie", classNumber: null, sex: "FEMALE" } },
    ]

    vi.mocked(prisma.enrollment.findMany).mockResolvedValue(mockEnrollments as any)
    vi.mocked(prisma.$transaction).mockResolvedValue([] as any)

    const result = await generateClassNumbers(classroomId)

    expect(result).toEqual({ success: true, data: { updatedCount: 2 } })
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})
