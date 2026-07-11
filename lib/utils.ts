import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ActionResult<T = void> =
  | { success: true; data: T; warning?: string }
  | { success: false; error: string }

