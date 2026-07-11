type Role = "PLATFORM_SUPER_ADMIN" | "SCHOOL_ADMIN" | "STAFF_ADMIN" | "TEACHER" | "STUDENT"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      role: Role
      schoolId: string | null
      teacherId: string | null
      studentId: string | null
    }
  }

  interface User {
    id: string
    email: string
    role: Role
    schoolId: string | null
    teacherId: string | null
    studentId: string | null
  }
}

declare module "next-auth" {
  interface JWT {
    id: string
    role: Role
    schoolId: string | null
    teacherId: string | null
    studentId: string | null
  }
}

import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production",
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/admin") ||
                           nextUrl.pathname.startsWith("/platform") ||
                           nextUrl.pathname.startsWith("/teacher") ||
                           nextUrl.pathname.startsWith("/student")
      
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      }
      
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.schoolId = user.schoolId
        token.teacherId = user.teacherId
        token.studentId = user.studentId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.schoolId = token.schoolId as string | null
        session.user.teacherId = token.teacherId as string | null
        session.user.studentId = token.studentId as string | null
      }
      return session
    }
  },
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  }
}
