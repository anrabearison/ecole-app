import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "@/auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Identifier", type: "text" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        try {
          const rawIdentifier = credentials?.identifier as string | undefined
          const password = credentials?.password as string | undefined

          if (!rawIdentifier || !password) {
            return null
          }

          const identifier = rawIdentifier.trim()
          let user = null

          // Try to find user by email first (if identifier looks like an email)
          if (identifier.includes('@')) {
            user = await prisma.user.findFirst({
              where: {
                email: {
                  equals: identifier,
                  mode: "insensitive"
                }
              },
              include: {
                teacher: true,
                student: true
              }
            })
          }

          // If not found by email, try to find student by registration number
          if (!user) {
            const student = await prisma.student.findFirst({
              where: { registrationNumber: identifier },
              include: { user: { include: { teacher: true, student: true } } }
            })

            if (student?.user) {
              user = student.user
            }
          }

          // If not found by student registration, try to find teacher by national ID number
          if (!user) {
            const teacher = await prisma.teacher.findFirst({
              where: { nationalIdNumber: identifier },
              include: { user: { include: { teacher: true, student: true } } }
            })

            if (teacher?.user) {
              user = teacher.user
            }
          }

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
        } catch (error) {
          console.error("[NextAuth Authorize Error]:", error)
          return null
        }
      }
    })
  ]
})
