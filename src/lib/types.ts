export type TimeRange = '1Y' | '3Y' | '5Y' | '10Y' | '20Y' | 'MAX'

export type MaturityKey =
  | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | '10Y' | '20Y' | '30Y'

export const MATURITY_SERIES: Record<MaturityKey, string> = {
  '1M': 'DGS1MO',
  '3M': 'DGS3MO',
  '6M': 'DGS6MO',
  '1Y': 'DGS1',
  '2Y': 'DGS2',
  '5Y': 'DGS5',
  '10Y': 'DGS10',
  '20Y': 'DGS20',
  '30Y': 'DGS30',
}

export const MATURITY_ORDER: MaturityKey[] = [
  '1M', '3M', '6M', '1Y', '2Y', '5Y', '10Y', '20Y', '30Y',
]

// Blue shades from darkest to lightest (all visible on white background)
export const MATURITY_BLUE_SHADES = [
  '#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb',
  '#3b82f6', '#60a5fa', '#38bdf8', '#0ea5e9', '#0284c7',
] as const

export const STOCK_SYMBOLS = [
  { symbol: 'SPY',     yahooSymbol: 'SPY',     label: 'S&P 500 ETF' },
  { symbol: 'BND',     yahooSymbol: 'BND',     label: '美國債券 ETF' },
  { symbol: 'TSM',     yahooSymbol: 'TSM',     label: '台積電 ADR' },
  { symbol: '0050',    yahooSymbol: '0050.TW', label: '元大台灣 50' },
  { symbol: '2330',    yahooSymbol: '2330.TW', label: '台積電' },
] as const

// Data shapes
export interface YieldDataPoint {
  date: string  // YYYY-MM
  value: number // percentage, e.g. 4.85
}

export interface YieldApiResponse {
  maturity: MaturityKey
  data: YieldDataPoint[]
  currentValue: number   // most recent non-null value
  previousValue: number  // second-most-recent non-null value
  updatedAt: string
}

export interface StockDataPoint {
  date: string  // YYYY-MM
  price: number
}

export interface StockApiResponse {
  symbol: string
  yahooSymbol: string
  label: string
  currentPrice: number
  changePercent: number // e.g. 1.23 means +1.23%
  history: StockDataPoint[]
  updatedAt: string
}
