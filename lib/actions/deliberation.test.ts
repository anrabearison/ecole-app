import { describe, it, expect, beforeEach, vi } from "vitest"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { can } from "@/lib/permissions"
import { calculateGeneralAverage } from "./average"
import {
  runDeliberationForClassroom,
  getDeliberation,
  listDeliberationsForClassroom,
  generateAnnualReportPdf,
} from "./deliberation"
import { generateAnnualReportPdfBuffer } from "@/lib/pdf/generate-pdf"

vi.mock("@/lib/auth")
vi.mock("@/lib/permissions", () => ({ can: vi.fn() }))
vi.mock("./average", () => ({ calculateGeneralAverage: vi.fn() }))
vi.mock("@/lib/pdf/generate-pdf", () => ({ generateAnnualReportPdfBuffer: vi.fn() }))

const mockSchoolId = "school-1"
const mockStudentId = "student-1"
const mockClassroomId = "classroom-1"
const mockPeriodId = "period-1"

const mockSession = (role: string, studentId?: string | null) => {
  vi.mocked(auth).mockResolvedValue({
    user: {
      id: "user-1",
      email: "test@test.com",
      role,
      schoolId: mockSchoolId,
      studentId: studentId ?? null,
    },
  } as any)
}

describe("deliberation actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(can).mockReturnValue(true)
  })

  describe("runDeliberationForClassroom", () => {
    it("should upsert deliberations for each student", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.classroom.findUnique as any).mockResolvedValue({
        id: mockClassroomId,
        schoolId: mockSchoolId,
        schoolYear: "2025-2026",
        passingThreshold: 10,
      })

      vi.mocked(prisma.period.findMany as any).mockResolvedValue([{ id: mockPeriodId }])
      vi.mocked(prisma.student.findMany as any).mockResolvedValue([{ id: mockStudentId }])
      vi.mocked(calculateGeneralAverage).mockResolvedValue({ success: true, data: 12 })
      vi.mocked(prisma.$transaction as any).mockImplementation(async (operations: any[]) => {
        return Promise.all(operations.map((op: any) => op))
      })

      const result = await runDeliberationForClassroom(mockClassroomId, "2025-2026")

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.processed).toBe(1)
      }
      expect(prisma.classroom.findUnique).toHaveBeenCalledWith({ where: { id: mockClassroomId } })
      expect(prisma.period.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { schoolId: mockSchoolId, schoolYear: "2025-2026" } }))
      expect(prisma.student.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { schoolId: mockSchoolId, classroomId: mockClassroomId } }))
    })

    it("should return Forbidden when permission denied", async () => {
      mockSession("STAFF_ADMIN")
      vi.mocked(can).mockReturnValue(false)

      const result = await runDeliberationForClassroom(mockClassroomId, "2025-2026")

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Forbidden")
      }
    })
  })

  describe("getDeliberation", () => {
    it("should return deliberation for a student", async () => {
      mockSession("STUDENT", mockStudentId)
      vi.mocked(prisma.deliberation.findUnique as any).mockResolvedValue({
        studentId: mockStudentId,
        schoolYear: "2025-2026",
        studentAverage: 12,
        decision: "PROMOTED",
        observations: "Well done",
        schoolId: mockSchoolId,
        student: { id: mockStudentId, firstName: "Jean", lastName: "Dupont" },
      })

      const result = await getDeliberation(mockStudentId, "2025-2026")

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toBeNull()
        expect(result.data?.studentId).toBe(mockStudentId)
      }
    })

    it("should forbid a student from accessing another student's deliberation", async () => {
      mockSession("STUDENT", "other-student")

      const result = await getDeliberation(mockStudentId, "2025-2026")

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Forbidden")
      }
    })
  })

  describe("listDeliberationsForClassroom", () => {
    it("should list deliberations for classroom students", async () => {
      mockSession("SCHOOL_ADMIN")
      vi.mocked(prisma.student.findMany as any).mockResolvedValue([
        {
          id: mockStudentId,
          firstName: "Jean",
          lastName: "Dupont",
          deliberations: [{ studentAverage: 12, decision: "PROMOTED", observations: "Très bien" }],
        },
      ])

      const result = await listDeliberationsForClassroom(mockClassroomId, "2025-2026")

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0].decision).toBe("PROMOTED")
      }
    })
  })

  describe("generateAnnualReportPdf", () => {
    it("should generate an annual report PDF", async () => {
      mockSession("SCHOOL_ADMIN")

      vi.mocked(prisma.student.findUnique as any).mockResolvedValue({
        id: mockStudentId,
        firstName: "Jean",
        lastName: "Dupont",
        classroom: {
          schoolGrade: { name: "6ème" },
          track: null,
          section: "A",
          schoolYear: "2025-2026",
        },
        school: { name: "Sekoly Test", address: "Antananarivo" },
        schoolId: mockSchoolId,
      })

      vi.mocked(prisma.deliberation.findUnique as any).mockResolvedValue({
        studentId: mockStudentId,
        schoolYear: "2025-2026",
        decision: "PROMOTED",
        observations: "Très bon",
      })

      vi.mocked(prisma.period.findMany as any).mockResolvedValue([{ id: mockPeriodId, name: "Trimestre 1" }])
      vi.mocked(calculateGeneralAverage).mockResolvedValue({ success: true, data: 14 })
      vi.mocked(generateAnnualReportPdfBuffer).mockResolvedValue(Buffer.from([1, 2, 3]))

      const result = await generateAnnualReportPdf(mockStudentId, "2025-2026")

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.fileName).toContain("Bulletin_Annuel")
        expect(result.data.pdfBuffer).toBeInstanceOf(Buffer)
      }
    })
  })
})
