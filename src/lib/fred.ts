import type { YieldDataPoint } from './types'

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'

export async function fetchFredSeries(
  seriesId: string,
  startDate: string,
  endDate: string,
  apiKey: string
): Promise<YieldDataPoint[]> {
  const url = new URL(FRED_BASE)
  url.searchParams.set('series_id', seriesId)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('file_type', 'json')
  url.searchParams.set('observation_start', startDate)
  url.searchParams.set('observation_end', endDate)
  url.searchParams.set('sort_order', 'asc')
  url.searchParams.set('frequency', 'm')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  let res: Response
  try {
    res = await fetch(url.toString(), { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
  if (!res.ok) throw new Error(`FRED API error: ${res.status}`)

  const json = await res.json()
  const observations = json.observations as Array<{ date: string; value: string }> | undefined
  if (!observations) throw new Error('FRED API error: unexpected response shape')
  return observations
    .filter((o) => o.value !== '.')
    .map((o) => ({
      date: o.date.slice(0, 7), // YYYY-MM
      value: parseFloat(o.value),
    }))
}
