"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { CheckCircle2, XCircle } from "lucide-react"
import { useEffect, useState } from "react"

type StatusFilterProps = {
  paramName?: string
}

export function StatusFilter({ paramName = "active" }: StatusFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<string | null>(searchParams.get(paramName))

  // Sync with URL params on mount
  useEffect(() => {
    setStatus(searchParams.get(paramName))
  }, [searchParams, paramName])

  const handleStatusChange = (newStatus: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (newStatus === null) {
      params.delete(paramName)
    } else {
      params.set(paramName, newStatus)
    }
    
    // Reset page to 1 when filter changes
    params.delete("page")
    
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Statut :</span>
      <div className="flex rounded-lg border border-gray-300 overflow-hidden">
        <button
          onClick={() => handleStatusChange(null)}
          className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
            status === null
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => handleStatusChange("true")}
          className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
            status === "true"
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Actif
        </button>
        <button
          onClick={() => handleStatusChange("false")}
          className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
            status === "false"
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          Inactif
        </button>
      </div>
    </div>
  )
}
