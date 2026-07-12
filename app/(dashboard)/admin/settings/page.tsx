"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Paramètres de l'école</h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            Pondération des notes
          </h2>
          <p className="text-blue-800 mb-4">
            La pondération des notes (examen/journalier) est maintenant configurée par période scolaire.
          </p>
          <p className="text-sm text-blue-700 mb-4">
            Chaque trimestre/période peut avoir sa propre pondération, adaptée aux spécificités de cette période.
          </p>
          <Link href="/admin/academics/periods">
            <Button>Gérer les périodes</Button>
          </Link>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Autres paramètres
          </h2>
          <p className="text-gray-600">
            D'autres paramètres seront ajoutés ici prochainement.
          </p>
        </div>
      </div>
    </div>
  )
}
