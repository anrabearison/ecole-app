import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ActionResult<T = void> =
  | { success: true; data: T; warnings?: string[] }
  | { success: false; error: string }

export type PaginatedActionResult<T = void> =
  | { success: true; data: T; pagination: { total: number; page: number; pageSize: number; totalPages: number }; warnings?: string[] }
  | { success: false; error: string }

