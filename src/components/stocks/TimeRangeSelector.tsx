'use client'

import type { TimeRange } from '@/lib/types'

const RANGES: TimeRange[] = ['1Y', '3Y', '5Y', '10Y', '20Y', 'MAX']

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-1.5 mb-4">
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={[
            'px-3 py-1 text-xs rounded border transition-colors',
            value === r
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100',
          ].join(' ')}
        >
          {r}
        </button>
      ))}
    </div>
  )
}
