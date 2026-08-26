"use client"

import { useActionState } from "react"
import { authenticate } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

export default function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined)

  return (
    <form action={formAction} className="space-y-6">
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
            Identifiant
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="email, numéro matricule, ou CIN"
          />
          <p className="mt-1 text-xs text-gray-500">
            Entrez votre adresse e-mail, votre numéro matricule (élève), ou votre numéro CIN (enseignant)
          </p>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="••••••••"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  )
}
