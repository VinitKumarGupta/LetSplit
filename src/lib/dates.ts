/**
 * Date utilities using Asia/Kolkata timezone.
 */

const TIMEZONE = 'Asia/Kolkata'

/**
 * Get today's date string in YYYY-MM-DD format using IST.
 */
export function getTodayIST(): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(now) // returns YYYY-MM-DD
}

/**
 * Get current month and year in IST.
 * Returns { month: 1-12, year: YYYY }
 */
export function getCurrentMonthIST(): { month: number; year: number } {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(now)

  const month = parseInt(parts.find(p => p.type === 'month')!.value)
  const year = parseInt(parts.find(p => p.type === 'year')!.value)
  return { month, year }
}

/**
 * Format a date string for display.
 * "2026-10-07" → "7 October 2026"
 */
export function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format a date string for compact display.
 * "2026-10-07" → "7 Oct 2026"
 */
export function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Get month name from month number (1-12).
 */
export function getMonthName(month: number): string {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleDateString('en-IN', { month: 'long' })
}

/**
 * Get the first and last day of a month as YYYY-MM-DD strings.
 */
export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}
