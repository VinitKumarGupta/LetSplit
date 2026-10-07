/**
 * Money utility functions.
 *
 * All monetary values are stored as integer paise (1 rupee = 100 paise).
 * This avoids floating-point precision issues.
 *
 * ROUNDING STRATEGY:
 * When dividing a total among N participants, each person gets
 * floor(total / N) paise. The remainder (total % N) extra paise
 * are distributed one each to the first `remainder` participants
 * (sorted by person_id ascending). This ensures the sum of all
 * shares exactly equals the trip total.
 *
 * Example: ₹225 (22500 paise) / 7 people
 *   base = floor(22500 / 7) = 3214 paise (₹32.14)
 *   remainder = 22500 % 7 = 2
 *   First 2 people get 3215 paise (₹32.15)
 *   Remaining 5 get 3214 paise (₹32.14)
 *   Total = 2×3215 + 5×3214 = 6430 + 16070 = 22500 ✓
 */

/**
 * Convert rupees to paise.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

/**
 * Convert paise to rupees for display.
 */
export function paiseToRupees(paise: number): number {
  return paise / 100
}

/**
 * Format paise as a rupee string.
 * e.g. 7500 → "₹75" or 11250 → "₹112.50"
 */
export function formatPaise(paise: number): string {
  const rupees = paiseToRupees(paise)
  // If it's a whole number, don't show decimals
  if (Number.isInteger(rupees)) {
    return `₹${rupees.toLocaleString('en-IN')}`
  }
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Calculate per-person shares for a trip.
 *
 * @param totalPaise - Total trip cost in paise
 * @param participantIds - Array of person IDs (sorted ascending)
 * @returns Map of person_id → amount_paise, guaranteed to sum to totalPaise
 */
export function calculateShares(
  totalPaise: number,
  participantIds: number[]
): Map<number, number> {
  const n = participantIds.length
  if (n === 0) return new Map()

  const sorted = [...participantIds].sort((a, b) => a - b)
  const base = Math.floor(totalPaise / n)
  const remainder = totalPaise % n
  const shares = new Map<number, number>()

  sorted.forEach((id, index) => {
    // First `remainder` people get 1 extra paisa
    shares.set(id, base + (index < remainder ? 1 : 0))
  })

  return shares
}

/**
 * Calculate the display per-person amount (approximate, for UI only).
 * Actual stored amounts use calculateShares for exactness.
 */
export function perPersonDisplay(totalPaise: number, count: number): string {
  if (count === 0) return '₹0'
  return formatPaise(Math.floor(totalPaise / count))
}
