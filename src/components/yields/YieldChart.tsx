'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceArea, ResponsiveContainer,
} from 'recharts'
import {
  MATURITY_ORDER, MATURITY_BLUE_SHADES,
  type MaturityKey, type YieldDataPoint, type TimeRange,
} from '@/lib/types'

const TIME_RANGES: TimeRange[] = ['1Y', '3Y', '5Y', '10Y', '20Y', 'MAX']

interface YieldChartProps {
  seriesData: Partial<Record<MaturityKey, YieldDataPoint[]>>
  selectedMaturities: MaturityKey[]
  onMaturityToggle: (m: MaturityKey) => void
  timeRange: TimeRange
  onTimeRangeChange: (r: TimeRange) => void
  inversionPeriods?: Array<{ start: string; end: string }>
}

function getLineColor(maturity: MaturityKey, selected: MaturityKey[]): string {
  const sorted = MATURITY_ORDER.filter((m) => selected.includes(m))
  const idx = sorted.indexOf(maturity)
  if (idx === -1) return MATURITY_BLUE_SHADES[0]
  const step = Math.max(1, Math.floor(MATURITY_BLUE_SHADES.length / sorted.length))
  return MATURITY_BLUE_SHADES[Math.min(idx * step, MATURITY_BLUE_SHADES.length - 1)]
}

function mergeSeriesData(
  seriesData: Partial<Record<MaturityKey, YieldDataPoint[]>>,
  selected: MaturityKey[]
): Array<Record<string, string | number>> {
  const dateMap = new Map<string, Record<string, number>>()
  selected.forEach((m) => {
    seriesData[m]?.forEach(({ date, value }) => {
      if (!dateMap.has(date)) dateMap.set(date, {})
      dateMap.get(date)![m] = value
    })
  })
  return Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }))
}

export function YieldChart({
  seriesData,
  selectedMaturities,
  onMaturityToggle,
  timeRange,
  onTimeRangeChange,
  inversionPeriods = [],
}: YieldChartProps) {
  const chartData = mergeSeriesData(seriesData, selectedMaturities)

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
      <div className="text-sm font-semibold text-slate-800 mb-3">
        殖利率歷史走勢 — 選擇存續期間
      </div>

      {/* Maturity toggle buttons */}
      <div role="group" aria-label="Maturity toggles" className="flex flex-wrap gap-1.5 mb-3">
        {MATURITY_ORDER.map((m) => {
          const isSelected = selectedMaturities.includes(m)
          return (
            <button
              key={m}
              onClick={() => onMaturityToggle(m)}
              className={[
                'px-2.5 py-1 text-xs font-semibold rounded border transition-colors',
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50',
              ].join(' ')}
            >
              {m}
            </button>
          )
        })}
      </div>

      {/* Time range buttons */}
      <div role="group" aria-label="Time range" className="flex gap-1 mb-3">
        {TIME_RANGES.map((r) => (
          <button
            key={r}
            onClick={() => onTimeRangeChange(r)}
            className={[
              'px-2.5 py-1 text-xs rounded border transition-colors',
              timeRange === r
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100',
            ].join(' ')}
          >
            {r}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            width={40}
          />
          <Tooltip
            formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
            labelStyle={{ fontSize: 11 }}
            contentStyle={{ fontSize: 11 }}
          />
          {inversionPeriods.map(({ start, end }, i) => (
            <ReferenceArea key={i} x1={start} x2={end} fill="#fef2f2" fillOpacity={0.6} />
          ))}
          {selectedMaturities.map((m) => (
            <Line
              key={m}
              type="monotone"
              dataKey={m}
              stroke={getLineColor(m, selectedMaturities)}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-400 mt-1">淡紅色區域為歷史倒掛期間</p>
    </div>
  )
}
