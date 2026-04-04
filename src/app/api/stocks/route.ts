import { NextRequest, NextResponse } from 'next/server'
import { fetchStockData } from '@/lib/yahoo'
import { timeRangeToDates } from '@/lib/utils'
import { STOCK_SYMBOLS, type TimeRange } from '@/lib/types'

export const revalidate = 900 // 15 minutes

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get('symbol') ?? ''
  const range = (searchParams.get('range') ?? '5Y') as TimeRange

  const stockConfig = STOCK_SYMBOLS.find((s) => s.symbol === symbol)
  if (!stockConfig) {
    return NextResponse.json({ error: `Unknown symbol: ${symbol}` }, { status: 400 })
  }

  const VALID_RANGES: TimeRange[] = ['1Y', '3Y', '5Y', '10Y', '20Y', 'MAX']
  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: 'Invalid range' }, { status: 400 })
  }

  const { start, end } = timeRangeToDates(range)
  let result
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      result = await fetchStockData(
        stockConfig.yahooSymbol,
        new Date(start),
        new Date(end)
      )
      break
    } catch (err) {
      console.error(`Yahoo Finance fetch error (attempt ${attempt + 1}):`, err)
    }
  }
  if (!result) {
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 502 })
  }

  return NextResponse.json({
    symbol: stockConfig.symbol,
    yahooSymbol: stockConfig.yahooSymbol,
    label: stockConfig.label,
    currentPrice: result.currentPrice,
    changePercent: result.changePercent,
    history: result.history,
    updatedAt: new Date().toISOString(),
  })
}
