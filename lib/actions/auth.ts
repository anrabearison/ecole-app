"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"
import { loginSchema } from "@/lib/validations/auth"

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const identifier = formData.get("identifier") as string
  const password = formData.get("password") as string

  const parsed = loginSchema.safeParse({ identifier, password })
  if (!parsed.success) {
    return parsed.error.issues[0]?.message || "Données invalides"
  }

  try {
    await signIn("credentials", {
      identifier: parsed.data.identifier,
      password: parsed.data.password,
      redirectTo: "/",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Identifiant ou mot de passe invalide"
        default:
          return "Une erreur est survenue lors de la connexion"
      }
    }
    // Re-throw NEXT_REDIRECT error so Next.js handles server-side redirect
    throw error
  }
}
