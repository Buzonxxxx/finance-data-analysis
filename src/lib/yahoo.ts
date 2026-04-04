import yahooFinance from 'yahoo-finance2'
import type { StockDataPoint } from './types'

export interface StockFetchResult {
  currentPrice: number
  changePercent: number
  history: StockDataPoint[]
}

export async function fetchStockData(
  yahooSymbol: string,
  startDate: Date,
  endDate: Date
): Promise<StockFetchResult> {
  const result = await yahooFinance.chart(yahooSymbol, {
    period1: startDate,
    period2: endDate,
    interval: '1mo',
    return: 'object',
  }) as {
    meta: { regularMarketPrice?: number; chartPreviousClose?: number }
    timestamp?: number[]
    indicators?: { quote?: Array<{ close?: Array<number | null> }> }
  }

  const meta = result.meta
  const timestamps = result.timestamp ?? []
  const closes = result.indicators?.quote?.[0]?.close ?? []

  const history: StockDataPoint[] = timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 7),
      price: closes[i] ?? 0,
    }))
    .filter((p) => p.price > 0)

  const currentPrice = meta.regularMarketPrice ?? 0
  const prevClose = meta.chartPreviousClose ?? currentPrice
  const changePercent = prevClose > 0
    ? ((currentPrice - prevClose) / prevClose) * 100
    : 0

  return { currentPrice, changePercent, history }
}
