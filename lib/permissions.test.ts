import { describe, it, expect } from "vitest"
import { can } from "./permissions"
import type { Role } from "@prisma/client"

describe("permissions", () => {
  describe("PLATFORM_SUPER_ADMIN", () => {
    it("should have full access to all resources", () => {
      const role: Role = "PLATFORM_SUPER_ADMIN"
      
      expect(can(role, "create", "student")).toBe(true)
      expect(can(role, "update", "student")).toBe(true)
      expect(can(role, "delete", "student")).toBe(true)
      expect(can(role, "view", "student")).toBe(true)
      
      expect(can(role, "create", "grade")).toBe(true)
      expect(can(role, "update", "grade")).toBe(true)
      expect(can(role, "delete", "grade")).toBe(true)
      expect(can(role, "view", "grade")).toBe(true)
      
      expect(can(role, "create", "classroom")).toBe(true)
      expect(can(role, "update", "classroom")).toBe(true)
      expect(can(role, "delete", "classroom")).toBe(true)
      expect(can(role, "view", "classroom")).toBe(true)
      
      expect(can(role, "create", "user")).toBe(true)
      expect(can(role, "update", "user")).toBe(true)
      expect(can(role, "delete", "user")).toBe(true)
      expect(can(role, "view", "user")).toBe(true)
      
      expect(can(role, "create", "schedule")).toBe(true)
      expect(can(role, "update", "schedule")).toBe(true)
      expect(can(role, "delete", "schedule")).toBe(true)
      expect(can(role, "view", "schedule")).toBe(true)
    })
  })

  describe("SCHOOL_ADMIN", () => {
    it("should have full access within their school", () => {
      const role: Role = "SCHOOL_ADMIN"
      
      expect(can(role, "create", "student")).toBe(true)
      expect(can(role, "update", "student")).toBe(true)
      expect(can(role, "delete", "student")).toBe(true)
      expect(can(role, "view", "student")).toBe(true)
      
      expect(can(role, "create", "grade")).toBe(true)
      expect(can(role, "update", "grade")).toBe(true)
      expect(can(role, "delete", "grade")).toBe(true)
      expect(can(role, "view", "grade")).toBe(true)
      
      expect(can(role, "create", "classroom")).toBe(true)
      expect(can(role, "update", "classroom")).toBe(true)
      expect(can(role, "delete", "classroom")).toBe(true)
      expect(can(role, "view", "classroom")).toBe(true)
      
      expect(can(role, "create", "user")).toBe(true)
      expect(can(role, "update", "user")).toBe(true)
      expect(can(role, "delete", "user")).toBe(true)
      expect(can(role, "view", "user")).toBe(true)
      
      expect(can(role, "create", "schedule")).toBe(true)
      expect(can(role, "update", "schedule")).toBe(true)
      expect(can(role, "delete", "schedule")).toBe(true)
      expect(can(role, "view", "schedule")).toBe(true)
    })
  })

  describe("STAFF_ADMIN", () => {
    it("should have limited access within their school", () => {
      const role: Role = "STAFF_ADMIN"
      
      // User: can view and modify, but not delete
      expect(can(role, "view", "user")).toBe(true)
      expect(can(role, "update", "user")).toBe(true)
      expect(can(role, "delete", "user")).toBe(false)
      
      // Student: full access
      expect(can(role, "create", "student")).toBe(true)
      expect(can(role, "update", "student")).toBe(true)
      expect(can(role, "delete", "student")).toBe(true)
      expect(can(role, "view", "student")).toBe(true)
      
      // Classroom: full access
      expect(can(role, "create", "classroom")).toBe(true)
      expect(can(role, "update", "classroom")).toBe(true)
      expect(can(role, "delete", "classroom")).toBe(true)
      expect(can(role, "view", "classroom")).toBe(true)
      
      // Subject: full access
      expect(can(role, "create", "subject")).toBe(true)
      expect(can(role, "update", "subject")).toBe(true)
      expect(can(role, "delete", "subject")).toBe(true)
      expect(can(role, "view", "subject")).toBe(true)
      
      // Grade: view only
      expect(can(role, "view", "grade")).toBe(true)
      expect(can(role, "create", "grade")).toBe(false)
      expect(can(role, "update", "grade")).toBe(false)
      expect(can(role, "delete", "grade")).toBe(false)
      
      // Schedule: view only
      expect(can(role, "view", "schedule")).toBe(true)
      expect(can(role, "create", "schedule")).toBe(false)
      expect(can(role, "update", "schedule")).toBe(false)
      expect(can(role, "delete", "schedule")).toBe(false)
      
      // Teacher: can view and modify, but not delete
      expect(can(role, "view", "teacher")).toBe(true)
      expect(can(role, "update", "teacher")).toBe(true)
      expect(can(role, "delete", "teacher")).toBe(false)
    })
  })

  describe("TEACHER", () => {
    it("should have access to their own grades only", () => {
      const role: Role = "TEACHER"
      const teacherId = "teacher-123"
      
      // Can view their own grades
      expect(can(role, "view", "grade", { ownerId: teacherId, teacherId })).toBe(true)
      
      // Cannot view other teachers' grades
      expect(can(role, "view", "grade", { ownerId: "other-teacher", teacherId })).toBe(false)
      
      // Can create/update grades (additional validation needed in action)
      expect(can(role, "create", "grade", { teacherId })).toBe(true)
      expect(can(role, "update", "grade", { teacherId })).toBe(true)
      
      // Can delete grades (additional validation needed in action)
      expect(can(role, "delete", "grade", { teacherId })).toBe(true)
    })

    it("should have access to their own schedule only", () => {
      const role: Role = "TEACHER"
      const teacherId = "teacher-123"
      
      // Can view their own schedule
      expect(can(role, "view", "schedule", { ownerId: teacherId, teacherId })).toBe(true)
      
      // Cannot view other teachers' schedules
      expect(can(role, "view", "schedule", { ownerId: "other-teacher", teacherId })).toBe(false)
      
      // Cannot modify schedules
      expect(can(role, "create", "schedule", { teacherId })).toBe(false)
      expect(can(role, "update", "schedule", { teacherId })).toBe(false)
      expect(can(role, "delete", "schedule", { teacherId })).toBe(false)
    })

    it("should have view access to classrooms and subjects", () => {
      const role: Role = "TEACHER"
      
      expect(can(role, "view", "classroom")).toBe(true)
      expect(can(role, "view", "subject")).toBe(true)
      
      // Cannot modify
      expect(can(role, "create", "classroom")).toBe(false)
      expect(can(role, "update", "classroom")).toBe(false)
      expect(can(role, "delete", "classroom")).toBe(false)
      
      expect(can(role, "create", "subject")).toBe(false)
      expect(can(role, "update", "subject")).toBe(false)
      expect(can(role, "delete", "subject")).toBe(false)
    })

    it("should have view access to students", () => {
      const role: Role = "TEACHER"
      
      expect(can(role, "view", "student")).toBe(true)
      
      // Cannot modify
      expect(can(role, "create", "student")).toBe(false)
      expect(can(role, "update", "student")).toBe(false)
      expect(can(role, "delete", "student")).toBe(false)
    })
  })

  describe("STUDENT", () => {
    it("should have access to their own grades only", () => {
      const role: Role = "STUDENT"
      const studentId = "student-123"
      
      // Can view their own grades
      expect(can(role, "view", "grade", { ownerId: studentId, studentId })).toBe(true)
      
      // Cannot view other students' grades
      expect(can(role, "view", "grade", { ownerId: "other-student", studentId })).toBe(false)
      
      // Cannot modify grades
      expect(can(role, "create", "grade", { studentId })).toBe(false)
      expect(can(role, "update", "grade", { studentId })).toBe(false)
      expect(can(role, "delete", "grade", { studentId })).toBe(false)
    })

    it("should have access to their classroom's schedule", () => {
      const role: Role = "STUDENT"
      const classroomId = "classroom-123"
      
      // Can view their classroom's schedule
      expect(can(role, "view", "schedule", { classroomId })).toBe(true)
      
      // Cannot modify schedules
      expect(can(role, "create", "schedule", { classroomId })).toBe(false)
      expect(can(role, "update", "schedule", { classroomId })).toBe(false)
      expect(can(role, "delete", "schedule", { classroomId })).toBe(false)
    })

    it("should not have access to other resources", () => {
      const role: Role = "STUDENT"
      
      expect(can(role, "view", "student")).toBe(false)
      expect(can(role, "view", "classroom")).toBe(false)
      expect(can(role, "view", "user")).toBe(false)
      expect(can(role, "view", "teacher")).toBe(false)
      expect(can(role, "view", "subject")).toBe(false)
    })
  })
})
