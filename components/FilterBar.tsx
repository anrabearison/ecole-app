"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, CheckCircle2, XCircle } from "lucide-react"
import { useState, useEffect, useRef } from "react"

interface FilterBarProps {
  showStatusFilter?: boolean
  searchPlaceholder?: string
  standalone?: boolean // If true, return just the search input without container
  preserveParams?: string[] // Additional params to preserve (e.g., 'sortBy')
}

export function FilterBar({ showStatusFilter = false, searchPlaceholder = "Rechercher...", standalone = false, preserveParams = [] }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")
  const [debouncedSearch, setDebouncedSearch] = useState(searchValue)
  const [statusValue, setStatusValue] = useState<string | null>(searchParams.get("active"))
  const isInitialMount = useRef(true)

  // Initialize state from URL params on mount only
  useEffect(() => {
    const initialSearch = searchParams.get("search") || ""
    const initialStatus = searchParams.get("active")
    setSearchValue(initialSearch)
    setDebouncedSearch(initialSearch)
    setStatusValue(initialStatus)
    isInitialMount.current = false
  }, []) // Only run on mount

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue])

  // Update URL when debounced search or status changes
  useEffect(() => {
    // Skip if this is the initial render (state was just set from URL)
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const params = new URLSearchParams()

    // Update search
    if (debouncedSearch) {
      params.set("search", debouncedSearch)
    }

    // Update status
    if (statusValue !== null) {
      params.set("active", statusValue)
    }

    // Preserve additional params
    preserveParams.forEach(param => {
      const value = searchParams.get(param)
      if (value) {
        params.set(param, value)
      }
    })

    // Reset page to 1 when filters change
    params.delete("page")

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }, [debouncedSearch, statusValue, router, pathname, searchParams, preserveParams])

  const handleStatusChange = (newStatus: string | null) => {
    setStatusValue(newStatus)
  }

  const hasActiveFilters = searchParams.get("search") || searchParams.get("active")

  // Standalone mode: return just the search input without container
  if (standalone) {
    return (
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Search Section */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap items-center gap-4">
          {showStatusFilter && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Statut :</span>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => handleStatusChange(null)}
                  className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    statusValue === null
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => handleStatusChange("true")}
                  className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    statusValue === "true"
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
                    statusValue === "false"
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Inactif
                </button>
              </div>
            </div>
          )}

          {/* Reset Section */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchValue("")
                setDebouncedSearch("")
                setStatusValue(null)
                // Preserve additional params when resetting
                const params = new URLSearchParams()
                preserveParams.forEach(param => {
                  const value = searchParams.get(param)
                  if (value) {
                    params.set(param, value)
                  }
                })
                const query = params.toString()
                router.push(query ? `${pathname}?${query}` : pathname)
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
