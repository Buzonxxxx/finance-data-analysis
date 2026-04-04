'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TimeRange, StockApiResponse } from '@/lib/types'
import { STOCK_SYMBOLS } from '@/lib/types'
import { TimeRangeSelector } from './TimeRangeSelector'
import { StockCard } from './StockCard'

export function StockTab() {
  const [stocks, setStocks] = useState<StockApiResponse[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('5Y')
  const [loading, setLoading] = useState(true)

  const fetchAllStocks = useCallback(async () => {
    setLoading(true)
    const results = await Promise.all(
      STOCK_SYMBOLS.map(async ({ symbol }) => {
        const res = await fetch(`/api/stocks?symbol=${symbol}&range=${timeRange}`)
        if (!res.ok) return null
        return res.json() as Promise<StockApiResponse>
      })
    )
    setStocks(results.filter((r): r is StockApiResponse => r !== null))
    setLoading(false)
  }, [timeRange])

  useEffect(() => { fetchAllStocks() }, [fetchAllStocks])

  if (loading) {
    return <div className="p-5 text-sm text-slate-400">載入中...</div>
  }

  return (
    <div className="p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-800">股價長期追蹤</h2>
        <p className="text-xs text-slate-500 mt-0.5">資料來源：Yahoo Finance（延遲 15 分鐘）</p>
      </div>

      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

      <div className="grid grid-cols-2 gap-3">
        {stocks.map((stock) => (
          <StockCard key={stock.symbol} stock={stock} />
        ))}
      </div>
    </div>
  )
}
