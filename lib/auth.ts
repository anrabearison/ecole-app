import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { Role } from "@prisma/client"

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

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            teacher: true,
            student: true
          }
        })

        if (!user || !user.active) {
          return null
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
          teacherId: user.teacher?.id || null,
          studentId: user.student?.id || null
        }
      }
    })
  ],
  callbacks: {
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
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  }
})
