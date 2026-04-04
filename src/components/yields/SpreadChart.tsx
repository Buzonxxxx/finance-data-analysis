'use client'

import {
  ComposedChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import type { YieldDataPoint } from '@/lib/types'

interface SpreadChartProps {
  shortData: YieldDataPoint[]
  longData: YieldDataPoint[]
  shortLabel: string
  longLabel: string
}

function computeSpread(
  shortTerm: YieldDataPoint[],
  longTerm: YieldDataPoint[]
): Array<{ date: string; spread: number }> {
  const longMap = new Map(longTerm.map((d) => [d.date, d.value]))
  return shortTerm
    .filter((d) => longMap.has(d.date))
    .map((d) => ({
      date: d.date,
      spread: parseFloat((longMap.get(d.date)! - d.value).toFixed(4)),
    }))
}

export function SpreadChart({ shortData, longData, shortLabel, longLabel }: SpreadChartProps) {
  const data = computeSpread(shortData, longData)
  const spreadLabel = `${longLabel}−${shortLabel} 利差`

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="text-sm font-semibold text-slate-800 mb-3">{spreadLabel}（Spread）</div>
      <ResponsiveContainer width="100%" height={120}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            width={40}
          />
          <Tooltip
            formatter={((value: number | undefined) =>
              value !== undefined ? [`${value.toFixed(2)}%`, spreadLabel] : ['-', spreadLabel]
            ) as any}
            contentStyle={{ fontSize: 11 }}
          />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 3" />
          <Bar dataKey="spread" maxBarSize={6}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.spread < 0 ? '#ef4444' : '#3b82f6'}
                fillOpacity={0.7}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
