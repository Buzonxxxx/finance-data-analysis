import type { MaturityKey, YieldApiResponse } from '@/lib/types'
import { MATURITY_ORDER } from '@/lib/types'

interface YieldStatCardsProps {
  yields: Partial<Record<MaturityKey, YieldApiResponse>>
}

export function YieldStatCards({ yields }: YieldStatCardsProps) {
  const two = yields['2Y']?.currentValue ?? 0
  const ten = yields['10Y']?.currentValue ?? 0
  const isInverted = two > 0 && ten > 0 && two > ten
  const spread = (ten - two).toFixed(2)

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {MATURITY_ORDER.map((maturity) => {
        const y = yields[maturity]
        if (!y) return null
        const change = y.currentValue - y.previousValue
        const isUp = change >= 0
        return (
          <div key={maturity} className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 flex-1 min-w-[90px]">
            <div className="text-xs text-slate-400 font-semibold tracking-wide mb-1">{maturity}</div>
            <div className="text-lg font-bold text-slate-800">{y.currentValue.toFixed(2)}%</div>
            <div className={`text-xs mt-0.5 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
              {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
            </div>
          </div>
        )
      })}
      {isInverted && (
        <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-2.5 flex-1 min-w-[120px]">
          <div className="text-xs text-red-500 font-semibold tracking-wide mb-1">⚠ 倒掛警示</div>
          <div className="text-sm font-bold text-red-700">2Y &gt; 10Y</div>
          <div className="text-xs text-red-600 mt-0.5">利差 {spread}%</div>
        </div>
      )}
    </div>
  )
}
