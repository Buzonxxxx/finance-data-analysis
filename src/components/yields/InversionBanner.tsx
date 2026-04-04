interface InversionBannerProps {
  isInverted: boolean
  spread: number         // long - short, negative when inverted
  daysSinceInversion: number
  shortLabel?: string
  longLabel?: string
}

export function InversionBanner({ isInverted, spread, daysSinceInversion, shortLabel = '2Y', longLabel = '10Y' }: InversionBannerProps) {
  if (!isInverted) return null

  return (
    <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4 flex items-start gap-3">
      <span className="text-xl mt-0.5">⚠️</span>
      <div>
        <h4 className="text-sm font-semibold text-red-700">
          殖利率曲線倒掛中（{shortLabel}−{longLabel} = {spread.toFixed(2)}%）
        </h4>
        <p className="text-xs text-red-500 mt-0.5">
          短端利率高於長端，歷史上常為景氣衰退前兆，已持續 {daysSinceInversion} 天
        </p>
      </div>
    </div>
  )
}
