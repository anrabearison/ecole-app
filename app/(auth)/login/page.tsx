import { DevSeedAccounts } from "@/components/DevSeedAccounts"
import LoginForm from "@/components/LoginForm"

export default function LoginPage() {
  const showDevAccounts = process.env.NODE_ENV === "development"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10">
      <div className="w-full max-w-6xl px-4">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-8 bg-white p-8 rounded-lg shadow-md">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Connexion</h2>
              <p className="mt-2 text-sm text-gray-600">Ecole App - Système de gestion scolaire</p>
            </div>
            <LoginForm />
          </div>

          {showDevAccounts ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <DevSeedAccounts />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
