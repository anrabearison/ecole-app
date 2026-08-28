"use client"

import { ToastProvider as ToastContextProvider } from "./Toast"

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <ToastContextProvider>{children}</ToastContextProvider>
}
