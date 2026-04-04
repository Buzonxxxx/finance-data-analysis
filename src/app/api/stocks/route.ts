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

  const { start, end } = timeRangeToDates(range)
  const result = await fetchStockData(
    stockConfig.yahooSymbol,
    new Date(start),
    new Date(end)
  )

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
