/**
 * ID Generator for Expense Items
 *
 * Strategy:
 * - Database IDs: Positive integers (1, 2, 3, ...)
 * - Temporary IDs: Negative integers (-1, -2, -3, ...)
 *
 * This ensures no conflicts between existing and new items.
 */

let nextTempId = -1

/**
 * Generate a temporary negative ID for new expense items.
 * This ID will be replaced with a real database ID after saving.
 */
export function generateTempId(): number {
  return nextTempId--
}

/**
 * Check if an ID is a temporary ID (negative number)
 */
export function isTempId(id: number): boolean {
  return id < 0
}

/**
 * Reset the temp ID counter (useful for testing)
 */
export function resetTempIdCounter(): void {
  nextTempId = -1
}
