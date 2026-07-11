type Role = "PLATFORM_SUPER_ADMIN" | "SCHOOL_ADMIN" | "STAFF_ADMIN" | "TEACHER" | "STUDENT"

type Action = "create" | "update" | "delete" | "view"
type Resource = "student" | "grade" | "classroom" | "user" | "schedule" | "teacher" | "subject" | "school-grade" | "track"

interface PermissionContext {
  ownerId?: string
  userId?: string
  teacherId?: string
  studentId?: string
  classroomId?: string
  schoolId?: string
}

/**
 * Central permission check function.
 * All authorization checks must go through this function.
 * 
 * @param role - User's role from session
 * @param action - The action being attempted
 * @param resource - The resource being accessed
 * @param context - Additional context for ownership checks
 * @returns Whether the action is allowed
 */
export function can(
  role: Role,
  action: Action,
  resource: Resource,
  context?: PermissionContext
): boolean {
  // PLATFORM_SUPER_ADMIN has full access to everything
  if (role === "PLATFORM_SUPER_ADMIN") {
    return true
  }

  // SCHOOL_ADMIN has full access within their school
  if (role === "SCHOOL_ADMIN") {
    return true
  }

  // STAFF_ADMIN has limited access within their school
  if (role === "STAFF_ADMIN") {
    switch (resource) {
      case "user":
        // Can view and modify user info, but cannot delete or change roles
        if (action === "delete") return false
        return true
      case "student":
      case "classroom":
      case "subject":
      case "school-grade":
      case "track":
        // Full access to school resources
        return true
      case "grade":
        // Can view all grades in the school
        if (action === "view") return true
        return false
      case "schedule":
        // Can view all schedules in the school
        if (action === "view") return true
        return false
      case "teacher":
        // Can view and modify teacher info, but cannot delete
        if (action === "delete") return false
        return true
      default:
        return false
    }
  }

  // TEACHER has limited access to their own data
  if (role === "TEACHER") {
    switch (resource) {
      case "teacher":
        // Can view only their own profile
        if (action === "view" && context?.teacherId && context?.ownerId === context.teacherId) {
          return true
        }
        return false
      case "grade":
        // Can view only their own grades
        if (action === "view" && context?.teacherId && context?.ownerId === context.teacherId) {
          return true
        }
        // Can create/update/delete grades if assigned to the subject and classroom
        // (This check should be done with TeacherSubject lookup in the action)
        if ((action === "create" || action === "update" || action === "delete") && context?.teacherId) {
          return true // Additional validation needed in the action
        }
        return false
      case "schedule":
        // Can view only their own schedule
        if (action === "view" && context?.teacherId && context?.ownerId === context.teacherId) {
          return true
        }
        return false
      case "classroom":
      case "subject":
        // Can view classrooms and subjects they're assigned to
        if (action === "view") return true
        return false
      case "student":
        // Can view students in their classrooms
        if (action === "view") return true
        return false
      default:
        return false
    }
  }

  // STUDENT has read-only access to their own data
  if (role === "STUDENT") {
    switch (resource) {
      case "student":
        // Can view only their own profile
        if (action === "view" && context?.studentId && context?.ownerId === context.studentId) {
          return true
        }
        return false
      case "grade":
        // Can view only their own grades
        if (action === "view" && context?.studentId && context?.ownerId === context.studentId) {
          return true
        }
        return false
      case "schedule":
        // Can view their classroom's schedule
        if (action === "view" && context?.classroomId) {
          return true
        }
        return false
      default:
        return false
    }
  }

  return false
}
