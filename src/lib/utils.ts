import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CLAIM_TIMEZONE = "Asia/Singapore"
type DateInput = Date | string | null | undefined

function getClaimDateParts(value: DateInput, withTime = false) {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: CLAIM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      : {}),
  })

  const partMap = new Map(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  )

  const year = partMap.get("year")
  const month = partMap.get("month")
  const day = partMap.get("day")

  if (!year || !month || !day) {
    return null
  }

  return {
    year,
    month,
    day,
    hour: partMap.get("hour"),
    minute: partMap.get("minute"),
  }
}

export function formatClaimDate(value: DateInput, fallback = "N/A") {
  const parts = getClaimDateParts(value)
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : fallback
}

export function formatClaimDateTime(value: DateInput, fallback = "N/A") {
  const parts = getClaimDateParts(value, true)
  if (!parts?.hour || !parts.minute) {
    return fallback
  }

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`
}

export function formatClaimMonthDay(value: DateInput, fallback = "") {
  const parts = getClaimDateParts(value)
  return parts ? `${parts.month}/${parts.day}` : fallback
}

export function toClaimLocalDate(value: DateInput) {
  const parts = getClaimDateParts(value)
  if (!parts) {
    return null
  }

  return new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 12)
}

// 生成带当前年份的claim ID
export function formatClaimId(claimId: number): string {
  const currentYear = new Date().getFullYear()
  return `CL-${currentYear}-${claimId.toString().padStart(4, '0')}`
}
