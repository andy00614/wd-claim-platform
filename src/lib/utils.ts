import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const CHINESE_CHARACTER_REGEX = /[\u3400-\u9FFF\uF900-\uFAFF]/u
const CHINESE_CHARACTER_REGEX_GLOBAL = /[\u3400-\u9FFF\uF900-\uFAFF]/gu

export const ENGLISH_ONLY_ERROR_MESSAGE = "仅支持英文输入，请使用英文字母和常用符号"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hasChineseCharacters(value: string) {
  return CHINESE_CHARACTER_REGEX.test(value)
}

export function removeChineseCharacters(value: string) {
  return value.replace(CHINESE_CHARACTER_REGEX_GLOBAL, "")
}

export function enforceEnglishInput(target: HTMLInputElement | HTMLTextAreaElement) {
  if (!target) {
    return true
  }

  if (!hasChineseCharacters(target.value)) {
    target.setCustomValidity("")
    return true
  }

  target.value = removeChineseCharacters(target.value)
  target.setCustomValidity(ENGLISH_ONLY_ERROR_MESSAGE)

  if (typeof target.reportValidity === "function") {
    target.reportValidity()
  }

  // 清除自定义错误信息，避免在输入被纠正后阻止表单提交
  setTimeout(() => {
    target.setCustomValidity("")
  }, 0)

  return false
}

// 生成带当前年份的claim ID
export function formatClaimId(claimId: number): string {
  const currentYear = new Date().getFullYear()
  return `CL-${currentYear}-${claimId.toString().padStart(4, '0')}`
}
