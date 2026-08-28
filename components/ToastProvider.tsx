"use client"

import { ToastProvider as ToastContextProvider } from "./Toast"
import { QueryProvider } from "./providers/query-provider"

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ToastContextProvider>{children}</ToastContextProvider>
    </QueryProvider>
  )
}
