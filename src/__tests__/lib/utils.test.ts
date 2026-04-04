import { timeRangeToDates, formatMonthLabel } from '@/lib/utils'

describe('timeRangeToDates', () => {
  const NOW = new Date('2026-04-04')

  it('returns 1 year ago for 1Y', () => {
    const { start } = timeRangeToDates('1Y', NOW)
    expect(start).toBe('2025-04-04')
  })

  it('returns 5 years ago for 5Y', () => {
    const { start } = timeRangeToDates('5Y', NOW)
    expect(start).toBe('2021-04-04')
  })

  it('returns 20 years ago for 20Y', () => {
    const { start } = timeRangeToDates('20Y', NOW)
    expect(start).toBe('2006-04-04')
  })

  it('returns fixed origin for MAX', () => {
    const { start } = timeRangeToDates('MAX', NOW)
    expect(start).toBe('1962-01-01')
  })

  it('end is always today formatted as YYYY-MM-DD', () => {
    const { end } = timeRangeToDates('5Y', NOW)
    expect(end).toBe('2026-04-04')
  })
})

describe('formatMonthLabel', () => {
  it('converts YYYY-MM-DD to YYYY-MM', () => {
    expect(formatMonthLabel('2024-03-15')).toBe('2024-03')
  })

  it('handles YYYY-MM input unchanged', () => {
    expect(formatMonthLabel('2024-03')).toBe('2024-03')
  })
})
