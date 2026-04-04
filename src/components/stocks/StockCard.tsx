'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { StockApiResponse } from '@/lib/types'

interface StockCardProps {
  stock: StockApiResponse
}

export function StockCard({ stock }: StockCardProps) {
  const isUp = stock.changePercent >= 0
  const priceStr = stock.currentPrice < 100
    ? stock.currentPrice.toFixed(2)
    : stock.currentPrice.toFixed(1)

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-slate-800">{stock.symbol}</div>
          <div className="text-xs text-slate-400">{stock.label}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-slate-800">${priceStr}</div>
          <div className={`text-xs ${isUp ? 'text-green-600' : 'text-red-600'}`}>
            {isUp ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={stock.history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, stock.symbol]}
            contentStyle={{ fontSize: 10 }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={isUp ? '#16a34a' : '#dc2626'}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
