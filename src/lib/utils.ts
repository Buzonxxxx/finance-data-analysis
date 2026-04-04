import type { TimeRange } from './types'

export function timeRangeToDates(
  range: TimeRange,
  now: Date = new Date()
): { start: string; end: string } {
  const end = formatDate(now)

  if (range === 'MAX') {
    return { start: '1962-01-01', end }
  }

  const yearsMap: Record<Exclude<TimeRange, 'MAX'>, number> = {
    '1Y': 1,
    '3Y': 3,
    '5Y': 5,
    '10Y': 10,
    '20Y': 20,
  }

  const years = yearsMap[range]
  const startDate = new Date(now)
  startDate.setFullYear(startDate.getFullYear() - years)
  return { start: formatDate(startDate), end }
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatMonthLabel(dateStr: string): string {
  return dateStr.slice(0, 7)
}
