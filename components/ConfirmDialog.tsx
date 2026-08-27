"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, Info, Pencil, Trash2, HelpCircle } from "lucide-react"

export type DialogVariant = "create" | "update" | "delete" | "default"

type ConfirmDialogProps = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: DialogVariant
  destructive?: boolean
  onConfirm: () => void
  onCancel?: () => void
  isLoading?: boolean
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Annuler",
  variant = "default",
  destructive = false,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
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

  // Determine effective visual style and defaults
  const isDestructive = destructive || variant === "delete"

  let icon = <HelpCircle className="w-6 h-6 text-blue-600" />
  let iconBg = "bg-blue-100 text-blue-600"
  let defaultTitle = "Confirmation"
  let defaultConfirmText = "Confirmer"
  let confirmBtnVariant: "default" | "destructive" | "outline" = "default"

  if (variant === "delete" || isDestructive) {
    icon = <Trash2 className="w-6 h-6 text-red-600" />
    iconBg = "bg-red-100 text-red-600"
    defaultTitle = title ?? "Confirmation de suppression"
    defaultConfirmText = confirmLabel ?? "Oui, supprimer"
    confirmBtnVariant = "destructive"
  } else if (variant === "create") {
    icon = <CheckCircle2 className="w-6 h-6 text-emerald-600" />
    iconBg = "bg-emerald-100 text-emerald-600"
    defaultTitle = title ?? "Confirmation d'enregistrement"
    defaultConfirmText = confirmLabel ?? "Oui, enregistrer"
  } else if (variant === "update") {
    icon = <Pencil className="w-6 h-6 text-indigo-600" />
    iconBg = "bg-indigo-100 text-indigo-600"
    defaultTitle = title ?? "Confirmation de modification"
    defaultConfirmText = confirmLabel ?? "Oui, modifier"
  } else {
    icon = <Info className="w-6 h-6 text-blue-600" />
    iconBg = "bg-blue-100 text-blue-600"
    defaultTitle = title ?? "Confirmation"
    defaultConfirmText = confirmLabel ?? "Confirmer"
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay with blur */}
      <div
        ref={overlayRef}
        onClick={(e) => {
          if (e.target === overlayRef.current) onCancel?.()
        }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
            {icon}
          </div>

          <div className="space-y-1.5 flex-1 pt-0.5">
            <h3 className="text-lg font-bold text-gray-900 leading-snug">
              {title || defaultTitle}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmBtnVariant} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Action en cours..." : defaultConfirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

type ConfirmSubmitButtonProps = {
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: DialogVariant
  destructive?: boolean
  children?: React.ReactNode
  className?: string
  size?: any
  btnVariant?: any
  disabled?: boolean
  type?: "button" | "submit"
  onConfirm?: () => void
}

/**
 * Button component that shows a confirmation dialog before submitting a form or executing an action.
 */
export function ConfirmActionButton({
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "delete",
  destructive,
  children,
  className,
  size,
  btnVariant,
  disabled,
  type = "button",
  onConfirm,
}: ConfirmSubmitButtonProps) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)

  const isDestructive = destructive ?? (variant === "delete")

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    // If attached to a form, validate before opening dialog
    const form = btnRef.current?.closest("form") as HTMLFormElement | null
    if (form && typeof form.checkValidity === "function") {
      if (!form.checkValidity()) {
        form.reportValidity()
        return
      }
    }

    setOpen(true)
  }

  function handleConfirm() {
    setOpen(false)
    const form = btnRef.current?.closest("form") as HTMLFormElement | null
    if (form) {
      if (typeof (form as any).requestSubmit === "function") {
        ;(form as any).requestSubmit()
      } else {
        form.submit()
      }
    } else if (onConfirm) {
      onConfirm()
    }
  }

  function handleCancel() {
    setOpen(false)
  }

  const defaultMsg =
    message ??
    (variant === "delete" || isDestructive
      ? "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
      : variant === "create"
      ? "Êtes-vous sûr de vouloir enregistrer ces nouvelles informations ?"
      : "Êtes-vous sûr de vouloir enregistrer les modifications apportées ?")

  return (
    <>
      <Button
        ref={btnRef as any}
        type={type}
        variant={btnVariant ?? (isDestructive ? "destructive" : "default")}
        size={size}
        className={className}
        disabled={disabled}
        onClick={handleClick}
      >
        {children}
      </Button>

      {open && (
        <ConfirmDialog
          title={title}
          message={defaultMsg}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          variant={variant}
          destructive={isDestructive}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}

export default ConfirmDialog
