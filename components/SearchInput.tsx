"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { useState, useEffect } from "react"

interface SearchInputProps {
  placeholder?: string
}

export function SearchInput({ placeholder = "Rechercher..." }: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [inputValue, setInputValue] = useState(searchParams.get("search") || "")
  const [debouncedValue, setDebouncedValue] = useState(inputValue)

  // Sync with URL params only on mount
  useEffect(() => {
    const initialValue = searchParams.get("search") || ""
    setInputValue(initialValue)
    setDebouncedValue(initialValue)
  }, []) // Empty dependency array = only run on mount

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [inputValue])

  // Update URL when debounced value changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (debouncedValue) {
      params.set("search", debouncedValue)
    } else {
      params.delete("search")
    }

    // Reset page to 1 when search changes
    params.delete("page")

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }, [debouncedValue, searchParams, router, pathname])

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  )
}
