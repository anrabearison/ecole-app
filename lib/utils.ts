import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ActionResult<T = void> =
  | { success: true; data: T; warnings?: string[] }
  | { success: false; error: string }

