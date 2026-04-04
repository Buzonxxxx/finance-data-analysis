import { NextRequest, NextResponse } from 'next/server'
import { fetchFredSeries } from '@/lib/fred'
import { timeRangeToDates } from '@/lib/utils'
import { MATURITY_SERIES, MATURITY_ORDER, type MaturityKey, type TimeRange } from '@/lib/types'

export const revalidate = 86400 // 24 hours

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const maturity = searchParams.get('maturity') as MaturityKey
  const range = (searchParams.get('range') ?? '5Y') as TimeRange

  if (!MATURITY_ORDER.includes(maturity)) {
    return NextResponse.json({ error: 'Invalid maturity' }, { status: 400 })
  }

  const VALID_RANGES: TimeRange[] = ['1Y', '3Y', '5Y', '10Y', '20Y', 'MAX']
  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: 'Invalid range' }, { status: 400 })
  }

  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'FRED_API_KEY not configured' }, { status: 500 })
  }

  const { start, end } = timeRangeToDates(range)
  const seriesId = MATURITY_SERIES[maturity]

  let data
  let lastErr: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      data = await fetchFredSeries(seriesId, start, end, apiKey)
      break
    } catch (err) {
      lastErr = err
      console.error(`FRED fetch error (attempt ${attempt + 1}):`, err)
    }
  }
  if (!data) {
    return NextResponse.json({ error: 'Failed to fetch yield data' }, { status: 502 })
  }

  const currentValue = data.at(-1)?.value ?? 0
  const previousValue = data.at(-2)?.value ?? 0

  return NextResponse.json({
    maturity,
    data,
    currentValue,
    previousValue,
    updatedAt: new Date().toISOString(),
  })
}
