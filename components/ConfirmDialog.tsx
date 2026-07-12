"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

type ConfirmDialogProps = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel?: () => void
}

export function ConfirmDialog({ title, message, confirmLabel = "Confirmer", cancelLabel = "Annuler", destructive = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel?.()
      }
    }

    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        ref={overlayRef}
        onClick={(e) => {
          if (e.target === overlayRef.current) onCancel?.()
        }}
        className="absolute inset-0 bg-black/40"
      />

      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        <p className="text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}

type ConfirmActionButtonProps = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  children?: React.ReactNode
  className?: string
  size?: any
  variant?: any
  onConfirm?: () => void
}

export function ConfirmActionButton({ title, message, confirmLabel, cancelLabel, destructive = true, children, className, size, variant, onConfirm }: ConfirmActionButtonProps) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)

  function handleOpen(e: React.MouseEvent) {
    e.preventDefault()
    setOpen(true)
  }

  function handleConfirm() {
    setOpen(false)
    // submit the nearest form if present
    const form = btnRef.current?.closest("form") as HTMLFormElement | null
    if (form) {
      // requestSubmit is preferred to trigger form validation
      ;(form as any).requestSubmit?.()
    } else {
      onConfirm?.()
    }
  }

  function handleCancel() {
    setOpen(false)
  }

  return (
    <>
      <Button ref={btnRef as any} variant={variant ?? (destructive ? "destructive" : "default")} size={size} className={className} onClick={handleOpen}>
        {children}
      </Button>

      {open && (
        <ConfirmDialog
          title={title}
          message={message}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          destructive={destructive}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}

export default ConfirmDialog
