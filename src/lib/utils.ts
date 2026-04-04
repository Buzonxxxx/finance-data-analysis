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
  return d.toISOString().slice(0, 10)
}

export function formatMonthLabel(dateStr: string): string {
  return dateStr.slice(0, 7)
}
