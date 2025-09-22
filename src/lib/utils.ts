import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 生成带当前年份的claim ID
export function formatClaimId(claimId: number): string {
  const currentYear = new Date().getFullYear()
  return `CL-${currentYear}-${claimId.toString().padStart(4, '0')}`
}
