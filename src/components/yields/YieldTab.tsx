'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MaturityKey, TimeRange, YieldApiResponse } from '@/lib/types'
import { MATURITY_ORDER } from '@/lib/types'
import { YieldStatCards } from './YieldStatCards'
import { InversionBanner } from './InversionBanner'
import { YieldChart } from './YieldChart'
import { SpreadChart } from './SpreadChart'

const DEFAULT_SELECTED: MaturityKey[] = ['2Y', '10Y']
const DEFAULT_RANGE: TimeRange = '5Y'

function calcDaysSinceInversion(
  data2Y: Array<{ date: string; value: number }>,
  data10Y: Array<{ date: string; value: number }>
): number {
  // Find first date (from most recent going back) where 10Y >= 2Y
  const tenMap = new Map(data10Y.map((d) => [d.date, d.value]))
  const sorted = [...data2Y].sort((a, b) => b.date.localeCompare(a.date))
  for (const point of sorted) {
    const ten = tenMap.get(point.date)
    if (ten !== undefined && ten >= point.value) {
      const endDate = new Date()
      const startDate = new Date(point.date + '-01')
      return Math.floor((endDate.getTime() - startDate.getTime()) / 86400000)
    }
  }
  return 0
}

function computeInversionPeriods(
  data2Y: Array<{ date: string; value: number }>,
  data10Y: Array<{ date: string; value: number }>
): Array<{ start: string; end: string }> {
  const tenMap = new Map(data10Y.map((d) => [d.date, d.value]))
  const periods: Array<{ start: string; end: string }> = []
  let currentStart: string | null = null

  for (const { date, value } of data2Y) {
    const ten = tenMap.get(date)
    if (ten !== undefined && value > ten) {
      if (!currentStart) currentStart = date
    } else {
      if (currentStart) {
        periods.push({ start: currentStart, end: date })
        currentStart = null
      }
    }
  }
  if (currentStart) periods.push({ start: currentStart, end: data2Y.at(-1)?.date ?? '' })
  return periods
}

export function YieldTab() {
  const [yields, setYields] = useState<Partial<Record<MaturityKey, YieldApiResponse>>>({})
  const [selectedMaturities, setSelectedMaturities] = useState<MaturityKey[]>(DEFAULT_SELECTED)
  const [timeRange, setTimeRange] = useState<TimeRange>(DEFAULT_RANGE)
  const [loading, setLoading] = useState(true)

  const fetchAllYields = useCallback(async () => {
    setLoading(true)
    const results = await Promise.all(
      MATURITY_ORDER.map(async (maturity) => {
        const res = await fetch(`/api/yields?maturity=${maturity}&range=${timeRange}`)
        if (!res.ok) return null
        const data: YieldApiResponse = await res.json()
        return [maturity, data] as const
      })
    )
    const yieldsMap: Partial<Record<MaturityKey, YieldApiResponse>> = {}
    results.forEach((r) => { if (r) yieldsMap[r[0]] = r[1] })
    setYields(yieldsMap)
    setLoading(false)
  }, [timeRange])

  useEffect(() => { fetchAllYields() }, [fetchAllYields])

  const handleMaturityToggle = (m: MaturityKey) => {
    setSelectedMaturities((prev) =>
      prev.includes(m)
        ? prev.length > 1 ? prev.filter((x) => x !== m) : prev
        : [...prev, m]
    )
  }

  // Derive short/long from selected maturities (by MATURITY_ORDER position)
  const sortedSelected = [...selectedMaturities].sort(
    (a, b) => MATURITY_ORDER.indexOf(a) - MATURITY_ORDER.indexOf(b)
  )
  const shortKey = sortedSelected[0]
  const longKey = sortedSelected[sortedSelected.length - 1]

  const shortVal = yields[shortKey]?.currentValue ?? 0
  const longVal = yields[longKey]?.currentValue ?? 0
  const isInverted = shortVal > 0 && longVal > 0 && shortVal > longVal

  const dataShort = yields[shortKey]?.data ?? []
  const dataLong = yields[longKey]?.data ?? []
  const inversionPeriods = computeInversionPeriods(dataShort, dataLong)
  const daysSince = isInverted ? calcDaysSinceInversion(dataShort, dataLong) : 0

  const seriesData: Partial<Record<MaturityKey, Array<{ date: string; value: number }>>> = {}
  MATURITY_ORDER.forEach((m) => { if (yields[m]) seriesData[m] = yields[m]!.data })

  if (loading) {
    return <div className="p-5 text-sm text-slate-400">載入中...</div>
  }

  return (
    <div className="p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-800">美國公債殖利率監測</h2>
        <p className="text-xs text-slate-500 mt-0.5">追蹤各存續期間殖利率走勢，觀察殖利率曲線倒掛現象</p>
      </div>

      <YieldStatCards yields={yields} />

      <InversionBanner
        isInverted={isInverted}
        spread={longVal - shortVal}
        daysSinceInversion={daysSince}
        shortLabel={shortKey}
        longLabel={longKey}
      />

      <YieldChart
        seriesData={seriesData}
        selectedMaturities={selectedMaturities}
        onMaturityToggle={handleMaturityToggle}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        inversionPeriods={inversionPeriods}
      />

      <SpreadChart
        shortData={dataShort}
        longData={dataLong}
        shortLabel={shortKey}
        longLabel={longKey}
      />
    </div>
  )
}
