"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import {
  updateProfileSchema,
  updatePasswordSchema,
  type UpdateProfileInput,
  type UpdatePasswordInput,
} from "@/lib/validations/profile"
import type { ActionResult } from "@/lib/utils"

export type UserProfileData = {
  id: string
  email: string | null
  role: string
  active: boolean
  createdAt: Date
  schoolName?: string
  teacher?: {
    id: string
    firstName: string
    lastName: string
    phone: string | null
    contractType: string | null
    registrationNumber: string | null
    nationalIdNumber: string
  } | null
  student?: {
    id: string
    firstName: string
    lastName: string
    registrationNumber: string
    guardianName: string | null
    guardianPhone: string | null
    status: string
    sex: string
    classroomName?: string
  } | null
}

export async function getProfile(): Promise<ActionResult<UserProfileData>> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        school: { select: { name: true } },
        teacher: true,
        student: {
          include: {
            classroom: {
              include: {
                schoolGrade: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
        schoolName: user.school?.name,
        teacher: user.teacher
          ? {
              id: user.teacher.id,
              firstName: user.teacher.firstName,
              lastName: user.teacher.lastName,
              phone: user.teacher.phone,
              contractType: user.teacher.contractType,
              registrationNumber: user.teacher.registrationNumber,
              nationalIdNumber: user.teacher.nationalIdNumber,
            }
          : null,
        student: user.student
          ? {
              id: user.student.id,
              firstName: user.student.firstName,
              lastName: user.student.lastName,
              registrationNumber: user.student.registrationNumber,
              guardianName: user.student.guardianName,
              guardianPhone: user.student.guardianPhone,
              status: user.student.status,
              sex: user.student.sex,
              classroomName: user.student.classroom
                ? `${user.student.classroom.schoolGrade.name} ${user.student.classroom.section}`
                : undefined,
            }
          : null,
      },
    }
  } catch (error) {
    console.error("[getProfile error]:", error)
    return { success: false, error: "Erreur lors de la récupération du profil" }
  }
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<ActionResult<{ message: string }>> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" }
  }

  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Données invalides",
    }
  }

  const { email, firstName, lastName, phone, guardianName, guardianPhone } = parsed.data

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { teacher: true, student: true },
    })

    if (!currentUser) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    // Email uniqueness check if changing email
    let updatedEmail = currentUser.email
    if (email && email.trim() !== "" && email.toLowerCase() !== currentUser.email?.toLowerCase()) {
      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (existing && existing.id !== currentUser.id) {
        return { success: false, error: "Cette adresse email est déjà utilisée par un autre compte" }
      }
      updatedEmail = email.toLowerCase()
    }

    await prisma.$transaction(async (tx) => {
      // Update User email
      await tx.user.update({
        where: { id: currentUser.id },
        data: { email: updatedEmail },
      })

      // Update Teacher profile if applicable
      if (currentUser.teacher) {
        await tx.teacher.update({
          where: { id: currentUser.teacher.id },
          data: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(phone !== undefined && { phone }),
          },
        })
      }

      // Update Student profile if applicable
      if (currentUser.student) {
        await tx.student.update({
          where: { id: currentUser.student.id },
          data: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(guardianName !== undefined && { guardianName }),
            ...(guardianPhone !== undefined && { guardianPhone }),
          },
        })
      }
    })

    return {
      success: true,
      data: { message: "Profil mis à jour avec succès" },
    }
  } catch (error) {
    console.error("[updateProfile error]:", error)
    return { success: false, error: "Erreur lors de la mise à jour du profil" }
  }
}

export async function updatePassword(
  input: UpdatePasswordInput
): Promise<ActionResult<{ message: string }>> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" }
  }

  const parsed = updatePasswordSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Données de mot de passe invalides",
    }
  }

  const { currentPassword, newPassword } = parsed.data

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isCurrentPasswordValid) {
      return { success: false, error: "Le mot de passe actuel est incorrect" }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update passwordHash
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    })

    return {
      success: true,
      data: { message: "Mot de passe modifié avec succès" },
    }
  } catch (error) {
    console.error("[updatePassword error]:", error)
    return { success: false, error: "Erreur lors de la modification du mot de passe" }
  }
}
