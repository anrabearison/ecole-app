"use client"

import { devSeedAccounts } from "@/lib/dev-seed-accounts"
import { CopyCredentialsButton } from "@/components/CopyCredentialsButton"

export function DevSeedAccounts() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Comptes de développement</h3>
        <p className="text-sm text-slate-600">Ces comptes sont uniquement affichés en environnement de développement.</p>
      </div>
      <div className="space-y-3">
        {devSeedAccounts.map((account) => (
          <div key={account.email} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">{account.label}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">{account.role}</span>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-700">
              <div>
                <span className="font-medium">Email :</span> {account.email}
              </div>
              <div>
                <span className="font-medium">Mot de passe :</span> {account.password}
              </div>
            </div>
            <CopyCredentialsButton email={account.email} password={account.password} />
          </div>
        ))}
      </div>
    </div>
  )
}
