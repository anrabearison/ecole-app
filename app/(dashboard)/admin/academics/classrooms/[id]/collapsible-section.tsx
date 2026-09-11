"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CollapsibleSectionProps {
  title: string
  icon?: React.ReactNode
  count?: number
  defaultOpen?: boolean
  onOpen?: () => void
  children: React.ReactNode
}

export function CollapsibleSection({ title, icon, count, defaultOpen = false, onOpen, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = () => {
    if (!isOpen && onOpen) {
      onOpen()
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      <Button
        onClick={handleToggle}
        variant="ghost"
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-indigo-500">{icon}</div>}
          <h2 className="text-sm font-semibold text-gray-800">
            {title}
            {count !== undefined && (
              <span className="ml-2 text-xs font-normal text-gray-500">({count})</span>
            )}
          </h2>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </Button>
      {isOpen && <div className="px-5 py-4 border-t border-gray-100">{children}</div>}
    </div>
  )
}
