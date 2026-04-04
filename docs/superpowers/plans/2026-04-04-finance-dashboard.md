# Finance Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js financial dashboard with US Treasury yield curve inversion monitoring and stock price tracking for SPY, BND, TSM, 0050, 2330, deployed to Zeabur.

**Architecture:** Next.js 14 App Router (client components for interactivity) with API Routes as proxy layer to FRED API (Treasury yields) and Yahoo Finance (stock prices). Data is fetched client-side via `fetch` with server-side caching via Next.js `revalidate`. No auth, no database.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Recharts, yahoo-finance2

---

## File Map

```
src/
├── app/
│   ├── layout.tsx                     # Root layout, metadata
│   ├── page.tsx                       # Main page: TabNav + tab content (client component)
│   ├── globals.css                    # Tailwind base styles
│   └── api/
│       ├── yields/route.ts            # FRED proxy → YieldApiResponse
│       └── stocks/route.ts            # Yahoo Finance proxy → StockApiResponse
├── lib/
│   ├── types.ts                       # All shared TypeScript types
│   ├── utils.ts                       # timeRangeToDates(), formatDate()
│   ├── fred.ts                        # fetchFredSeries() — server-side only
│   └── yahoo.ts                       # fetchStockHistory(), fetchStockQuote() — server-side only
├── components/
│   ├── TabNav.tsx                     # Tab navigation bar
│   ├── yields/
│   │   ├── YieldTab.tsx               # Data fetching + layout for yield tab
│   │   ├── YieldStatCards.tsx         # Row of current yield cards (1M–30Y)
│   │   ├── InversionBanner.tsx        # Red banner when 2Y > 10Y
│   │   ├── YieldChart.tsx             # Multi-line Recharts chart + maturity toggles
│   │   └── SpreadChart.tsx            # 10Y−2Y spread bar/area chart
│   └── stocks/
│       ├── StockTab.tsx               # Data fetching + layout for stock tab
│       ├── TimeRangeSelector.tsx      # 1Y/3Y/5Y/10Y/20Y/MAX buttons
│       └── StockCard.tsx              # Stock card with mini Recharts LineChart
└── __tests__/
    ├── lib/
    │   ├── utils.test.ts
    │   ├── fred.test.ts
    │   └── yahoo.test.ts
    ├── api/
    │   ├── yields.test.ts
    │   └── stocks.test.ts
    └── components/
        ├── TabNav.test.tsx
        ├── yields/
        │   ├── YieldStatCards.test.tsx
        │   ├── InversionBanner.test.tsx
        │   ├── YieldChart.test.tsx
        │   └── SpreadChart.test.tsx
        └── stocks/
            ├── TimeRangeSelector.test.tsx
            └── StockCard.test.tsx
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `src/app/layout.tsx`, `src/app/globals.css`
- Create: `.env.example`, `.gitignore`, `jest.config.ts`, `jest.setup.ts`

- [ ] **Step 1: Scaffold Next.js project**

Run inside `/Users/louis.liao/code/finance-data-analysis`:
```bash
npx create-next-app@14 . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-eslint \
  --import-alias '@/*' \
  --yes
```
Expected: Next.js project files created in current directory.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install recharts yahoo-finance2
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest ts-jest
```

- [ ] **Step 3: Configure Jest**

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Create .env.example**

```bash
# .env.example
FRED_API_KEY=your_fred_api_key_here
# Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html
```

- [ ] **Step 5: Update .gitignore**

Add to `.gitignore`:
```
.env.local
.env*.local
```

- [ ] **Step 6: Update root layout**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '總經財務分析',
  description: '公債殖利率倒掛監測與股價長期追蹤',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```
Expected: Server starts at http://localhost:3000, no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with TypeScript, Tailwind, Recharts"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Write types**

Create `src/lib/types.ts`:
```typescript
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

// Blue shades from darkest to lightest (all visible on white)
export const MATURITY_BLUE_SHADES = [
  '#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb',
  '#3b82f6', '#60a5fa', '#38bdf8', '#0ea5e9', '#0284c7',
]

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
}

export interface AllYieldsApiResponse {
  yields: Record<MaturityKey, YieldApiResponse>
  updatedAt: string // ISO datetime string
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Utility Functions

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/__tests__/lib/utils.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/lib/utils.test.ts`:
```typescript
import { timeRangeToDates, formatMonthLabel } from '@/lib/utils'

describe('timeRangeToDates', () => {
  const NOW = new Date('2026-04-04')

  it('returns 1 year ago for 1Y', () => {
    const { start } = timeRangeToDates('1Y', NOW)
    expect(start).toBe('2025-04-04')
  })

  it('returns 5 years ago for 5Y', () => {
    const { start } = timeRangeToDates('5Y', NOW)
    expect(start).toBe('2021-04-04')
  })

  it('returns 20 years ago for 20Y', () => {
    const { start } = timeRangeToDates('20Y', NOW)
    expect(start).toBe('2006-04-04')
  })

  it('returns fixed origin for MAX', () => {
    const { start } = timeRangeToDates('MAX', NOW)
    expect(start).toBe('1962-01-01')
  })

  it('end is always today formatted as YYYY-MM-DD', () => {
    const { end } = timeRangeToDates('5Y', NOW)
    expect(end).toBe('2026-04-04')
  })
})

describe('formatMonthLabel', () => {
  it('converts YYYY-MM-DD to YYYY-MM', () => {
    expect(formatMonthLabel('2024-03-15')).toBe('2024-03')
  })

  it('handles YYYY-MM input unchanged', () => {
    expect(formatMonthLabel('2024-03')).toBe('2024-03')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/lib/utils.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '@/lib/utils'`

- [ ] **Step 3: Implement utils**

Create `src/lib/utils.ts`:
```typescript
import type { TimeRange } from './types'

export function timeRangeToDates(
  range: TimeRange,
  now: Date = new Date()
): { start: string; end: string } {
  const end = formatDate(now)

  if (range === 'MAX') {
    return { start: '1962-01-01', end }
  }

  const yearsMap: Record<Exclude<TimeRange, 'MAX'>, number> = {
    '1Y': 1,
    '3Y': 3,
    '5Y': 5,
    '10Y': 10,
    '20Y': 20,
  }

  const years = yearsMap[range]
  const startDate = new Date(now)
  startDate.setFullYear(startDate.getFullYear() - years)
  return { start: formatDate(startDate), end }
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function formatMonthLabel(dateStr: string): string {
  return dateStr.slice(0, 7)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/lib/utils.test.ts --no-coverage
```
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils.ts src/__tests__/lib/utils.test.ts
git commit -m "feat: add timeRangeToDates and formatMonthLabel utilities"
```

---

## Task 4: FRED API Library

**Files:**
- Create: `src/lib/fred.ts`
- Create: `src/__tests__/lib/fred.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/lib/fred.test.ts`:
```typescript
import { fetchFredSeries } from '@/lib/fred'

const MOCK_FRED_RESPONSE = {
  observations: [
    { date: '2024-01-02', value: '4.33' },
    { date: '2024-02-01', value: '4.45' },
    { date: '2024-03-01', value: '.' },  // FRED uses '.' for missing values
    { date: '2024-04-01', value: '4.60' },
  ],
}

describe('fetchFredSeries', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_FRED_RESPONSE,
    } as Response)
  })

  it('returns parsed data points excluding missing values', async () => {
    const result = await fetchFredSeries('DGS10', '2024-01-01', '2024-04-30', 'test-key')
    expect(result).toEqual([
      { date: '2024-01', value: 4.33 },
      { date: '2024-02', value: 4.45 },
      { date: '2024-04', value: 4.60 },
    ])
  })

  it('calls FRED API with correct URL', async () => {
    await fetchFredSeries('DGS10', '2024-01-01', '2024-04-30', 'test-key')
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string
    expect(calledUrl).toContain('series_id=DGS10')
    expect(calledUrl).toContain('api_key=test-key')
    expect(calledUrl).toContain('observation_start=2024-01-01')
    expect(calledUrl).toContain('frequency=m')
  })

  it('throws on HTTP error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429 } as Response)
    await expect(
      fetchFredSeries('DGS10', '2024-01-01', '2024-04-30', 'test-key')
    ).rejects.toThrow('FRED API error: 429')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/lib/fred.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '@/lib/fred'`

- [ ] **Step 3: Implement fred.ts**

Create `src/lib/fred.ts`:
```typescript
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

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`FRED API error: ${res.status}`)

  const json = await res.json()
  return (json.observations as Array<{ date: string; value: string }>)
    .filter((o) => o.value !== '.')
    .map((o) => ({
      date: o.date.slice(0, 7), // YYYY-MM
      value: parseFloat(o.value),
    }))
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/lib/fred.test.ts --no-coverage
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/fred.ts src/__tests__/lib/fred.test.ts
git commit -m "feat: add FRED API library with tests"
```

---

## Task 5: Yahoo Finance Library

**Files:**
- Create: `src/lib/yahoo.ts`
- Create: `src/__tests__/lib/yahoo.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/lib/yahoo.test.ts`:
```typescript
import { fetchStockData } from '@/lib/yahoo'

// Mock yahoo-finance2
jest.mock('yahoo-finance2', () => ({
  __esModule: true,
  default: {
    chart: jest.fn(),
  },
}))

import yahooFinance from 'yahoo-finance2'

const MOCK_CHART = {
  meta: {
    regularMarketPrice: 568.2,
    chartPreviousClose: 561.3,
    currency: 'USD',
  },
  timestamp: [1609459200, 1612137600, 1614556800],
  indicators: {
    quote: [{ close: [375.0, 388.5, 395.1] }],
  },
}

describe('fetchStockData', () => {
  beforeEach(() => {
    ;(yahooFinance.chart as jest.Mock).mockResolvedValue(MOCK_CHART)
  })

  it('returns current price from meta', async () => {
    const result = await fetchStockData('SPY', new Date('2021-01-01'), new Date('2021-04-01'))
    expect(result.currentPrice).toBe(568.2)
  })

  it('calculates changePercent from meta', async () => {
    const result = await fetchStockData('SPY', new Date('2021-01-01'), new Date('2021-04-01'))
    // (568.2 - 561.3) / 561.3 * 100
    expect(result.changePercent).toBeCloseTo(1.228, 2)
  })

  it('returns monthly history with YYYY-MM dates', async () => {
    const result = await fetchStockData('SPY', new Date('2021-01-01'), new Date('2021-04-01'))
    expect(result.history).toEqual([
      { date: '2021-01', price: 375.0 },
      { date: '2021-02', price: 388.5 },
      { date: '2021-03', price: 395.1 },
    ])
  })

  it('calls yahoo-finance2 chart with correct params', async () => {
    const start = new Date('2021-01-01')
    const end = new Date('2021-04-01')
    await fetchStockData('SPY', start, end)
    expect(yahooFinance.chart).toHaveBeenCalledWith('SPY', {
      period1: start,
      period2: end,
      interval: '1mo',
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/lib/yahoo.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '@/lib/yahoo'`

- [ ] **Step 3: Implement yahoo.ts**

Create `src/lib/yahoo.ts`:
```typescript
import yahooFinance from 'yahoo-finance2'
import type { StockDataPoint } from './types'

export interface StockFetchResult {
  currentPrice: number
  changePercent: number
  history: StockDataPoint[]
}

export async function fetchStockData(
  yahooSymbol: string,
  startDate: Date,
  endDate: Date
): Promise<StockFetchResult> {
  const result = await yahooFinance.chart(yahooSymbol, {
    period1: startDate,
    period2: endDate,
    interval: '1mo',
  })

  const meta = result.meta
  const timestamps = result.timestamp ?? []
  const closes = result.indicators?.quote?.[0]?.close ?? []

  const history: StockDataPoint[] = timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 7),
      price: closes[i] ?? 0,
    }))
    .filter((p) => p.price > 0)

  const currentPrice = meta.regularMarketPrice ?? 0
  const prevClose = meta.chartPreviousClose ?? currentPrice
  const changePercent = prevClose > 0
    ? ((currentPrice - prevClose) / prevClose) * 100
    : 0

  return { currentPrice, changePercent, history }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/lib/yahoo.test.ts --no-coverage
```
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/yahoo.ts src/__tests__/lib/yahoo.test.ts
git commit -m "feat: add Yahoo Finance library with tests"
```

---

## Task 6: API Route /api/yields

**Files:**
- Create: `src/app/api/yields/route.ts`
- Create: `src/__tests__/api/yields.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/api/yields.test.ts`:
```typescript
import { GET } from '@/app/api/yields/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/fred', () => ({
  fetchFredSeries: jest.fn().mockResolvedValue([
    { date: '2024-01', value: 4.33 },
    { date: '2024-02', value: 4.45 },
  ]),
}))

describe('GET /api/yields', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, FRED_API_KEY: 'test-key' }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns yield data for a valid maturity', async () => {
    const req = new NextRequest(
      'http://localhost/api/yields?maturity=10Y&range=5Y'
    )
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.maturity).toBe('10Y')
    expect(data.data).toHaveLength(2)
    expect(data.currentValue).toBe(4.45)
    expect(data.previousValue).toBe(4.33)
  })

  it('returns 400 for invalid maturity', async () => {
    const req = new NextRequest(
      'http://localhost/api/yields?maturity=INVALID&range=5Y'
    )
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 500 when FRED_API_KEY is missing', async () => {
    delete process.env.FRED_API_KEY
    const req = new NextRequest(
      'http://localhost/api/yields?maturity=10Y&range=5Y'
    )
    const res = await GET(req)
    expect(res.status).toBe(500)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/api/yields.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '@/app/api/yields/route'`

- [ ] **Step 3: Implement the route**

Create `src/app/api/yields/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { fetchFredSeries } from '@/lib/fred'
import { timeRangeToDates } from '@/lib/utils'
import { MATURITY_SERIES, MATURITY_ORDER, type MaturityKey, type TimeRange } from '@/lib/types'

export const revalidate = 86400 // 24 hours

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const maturity = searchParams.get('maturity') as MaturityKey
  const range = (searchParams.get('range') ?? '5Y') as TimeRange

  if (!MATURITY_ORDER.includes(maturity)) {
    return NextResponse.json({ error: 'Invalid maturity' }, { status: 400 })
  }

  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'FRED_API_KEY not configured' }, { status: 500 })
  }

  const { start, end } = timeRangeToDates(range)
  const seriesId = MATURITY_SERIES[maturity]

  const data = await fetchFredSeries(seriesId, start, end, apiKey)
  const currentValue = data.at(-1)?.value ?? 0
  const previousValue = data.at(-2)?.value ?? 0

  return NextResponse.json({
    maturity,
    data,
    currentValue,
    previousValue,
    updatedAt: new Date().toISOString(),
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/api/yields.test.ts --no-coverage
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/yields/route.ts src/__tests__/api/yields.test.ts
git commit -m "feat: add /api/yields route with FRED proxy and caching"
```

---

## Task 7: API Route /api/stocks

**Files:**
- Create: `src/app/api/stocks/route.ts`
- Create: `src/__tests__/api/stocks.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/api/stocks.test.ts`:
```typescript
import { GET } from '@/app/api/stocks/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/yahoo', () => ({
  fetchStockData: jest.fn().mockResolvedValue({
    currentPrice: 568.2,
    changePercent: 1.23,
    history: [{ date: '2025-04', price: 550.0 }],
  }),
}))

describe('GET /api/stocks', () => {
  it('returns stock data for a valid symbol', async () => {
    const req = new NextRequest(
      'http://localhost/api/stocks?symbol=SPY&range=5Y'
    )
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.symbol).toBe('SPY')
    expect(data.currentPrice).toBe(568.2)
    expect(data.changePercent).toBe(1.23)
    expect(data.history).toHaveLength(1)
  })

  it('returns 400 for unknown symbol', async () => {
    const req = new NextRequest(
      'http://localhost/api/stocks?symbol=UNKNOWN&range=5Y'
    )
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/api/stocks.test.ts --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Implement the route**

Create `src/app/api/stocks/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { fetchStockData } from '@/lib/yahoo'
import { timeRangeToDates } from '@/lib/utils'
import { STOCK_SYMBOLS, type TimeRange } from '@/lib/types'

export const revalidate = 900 // 15 minutes

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get('symbol') ?? ''
  const range = (searchParams.get('range') ?? '5Y') as TimeRange

  const stockConfig = STOCK_SYMBOLS.find((s) => s.symbol === symbol)
  if (!stockConfig) {
    return NextResponse.json({ error: `Unknown symbol: ${symbol}` }, { status: 400 })
  }

  const { start, end } = timeRangeToDates(range)
  const result = await fetchStockData(
    stockConfig.yahooSymbol,
    new Date(start),
    new Date(end)
  )

  return NextResponse.json({
    symbol: stockConfig.symbol,
    yahooSymbol: stockConfig.yahooSymbol,
    label: stockConfig.label,
    currentPrice: result.currentPrice,
    changePercent: result.changePercent,
    history: result.history,
    updatedAt: new Date().toISOString(),
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/api/stocks.test.ts --no-coverage
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/stocks/route.ts src/__tests__/api/stocks.test.ts
git commit -m "feat: add /api/stocks route with Yahoo Finance proxy and caching"
```

---

## Task 8: TabNav Component

**Files:**
- Create: `src/components/TabNav.tsx`
- Create: `src/__tests__/components/TabNav.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/components/TabNav.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TabNav } from '@/components/TabNav'

describe('TabNav', () => {
  it('renders both tabs', () => {
    render(<TabNav activeTab="yields" onTabChange={jest.fn()} updatedAt="2026-04-04T09:30:00Z" />)
    expect(screen.getByText('公債殖利率')).toBeInTheDocument()
    expect(screen.getByText('股價追蹤')).toBeInTheDocument()
  })

  it('marks the active tab with blue underline class', () => {
    render(<TabNav activeTab="yields" onTabChange={jest.fn()} updatedAt="2026-04-04T09:30:00Z" />)
    const yieldTab = screen.getByText('公債殖利率').closest('button')
    expect(yieldTab).toHaveClass('border-blue-600')
  })

  it('calls onTabChange when clicking a tab', async () => {
    const onTabChange = jest.fn()
    render(<TabNav activeTab="yields" onTabChange={onTabChange} updatedAt="2026-04-04T09:30:00Z" />)
    await userEvent.click(screen.getByText('股價追蹤'))
    expect(onTabChange).toHaveBeenCalledWith('stocks')
  })

  it('shows last update time', () => {
    render(<TabNav activeTab="yields" onTabChange={jest.fn()} updatedAt="2026-04-04T09:30:00Z" />)
    expect(screen.getByText(/更新/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/components/TabNav.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Implement TabNav**

Create `src/components/TabNav.tsx`:
```tsx
'use client'

export type TabName = 'yields' | 'stocks'

interface TabNavProps {
  activeTab: TabName
  onTabChange: (tab: TabName) => void
  updatedAt: string
}

export function TabNav({ activeTab, onTabChange, updatedAt }: TabNavProps) {
  const tabs: { key: TabName; label: string }[] = [
    { key: 'yields', label: '公債殖利率' },
    { key: 'stocks', label: '股價追蹤' },
  ]

  const updatedDate = new Date(updatedAt).toLocaleString('zh-TW', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })

  return (
    <nav className="bg-white border-b border-slate-200 px-5 flex items-center justify-between h-13">
      <div className="flex items-center gap-2">
        <span className="text-base font-bold text-slate-800">📊 總經財務分析</span>
      </div>
      <div className="flex">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={[
              'px-5 py-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === key
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-500 border-transparent hover:text-slate-700',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
      <span className="text-xs text-slate-400">更新：{updatedDate}</span>
    </nav>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/components/TabNav.test.tsx --no-coverage
```
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/TabNav.tsx src/__tests__/components/TabNav.test.tsx
git commit -m "feat: add TabNav component"
```

---

## Task 9: YieldStatCards Component

**Files:**
- Create: `src/components/yields/YieldStatCards.tsx`
- Create: `src/__tests__/components/yields/YieldStatCards.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/components/yields/YieldStatCards.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { YieldStatCards } from '@/components/yields/YieldStatCards'
import type { YieldApiResponse } from '@/lib/types'

const makeYield = (maturity: string, current: number, prev: number): YieldApiResponse => ({
  maturity: maturity as any,
  data: [],
  currentValue: current,
  previousValue: prev,
  updatedAt: '',
})

describe('YieldStatCards', () => {
  it('renders a card per maturity', () => {
    const yields = {
      '2Y': makeYield('2Y', 4.85, 4.82),
      '10Y': makeYield('10Y', 4.62, 4.64),
    } as any
    render(<YieldStatCards yields={yields} />)
    expect(screen.getByText('2Y')).toBeInTheDocument()
    expect(screen.getByText('10Y')).toBeInTheDocument()
  })

  it('shows inversion warning card when 2Y > 10Y', () => {
    const yields = {
      '2Y': makeYield('2Y', 4.85, 4.82),
      '10Y': makeYield('10Y', 4.62, 4.64),
    } as any
    render(<YieldStatCards yields={yields} />)
    expect(screen.getByText(/倒掛/)).toBeInTheDocument()
  })

  it('does not show inversion card when 2Y < 10Y', () => {
    const yields = {
      '2Y': makeYield('2Y', 4.00, 3.98),
      '10Y': makeYield('10Y', 4.62, 4.64),
    } as any
    render(<YieldStatCards yields={yields} />)
    expect(screen.queryByText(/倒掛/)).not.toBeInTheDocument()
  })

  it('shows up arrow and green for positive change', () => {
    const yields = { '2Y': makeYield('2Y', 4.85, 4.82) } as any
    render(<YieldStatCards yields={yields} />)
    expect(screen.getByText(/▲/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/components/yields/YieldStatCards.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Implement YieldStatCards**

Create `src/components/yields/YieldStatCards.tsx`:
```tsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/components/yields/YieldStatCards.test.tsx --no-coverage
```
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/yields/YieldStatCards.tsx src/__tests__/components/yields/YieldStatCards.test.tsx
git commit -m "feat: add YieldStatCards component with inversion indicator"
```

---

## Task 10: InversionBanner Component

**Files:**
- Create: `src/components/yields/InversionBanner.tsx`
- Create: `src/__tests__/components/yields/InversionBanner.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/components/yields/InversionBanner.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { InversionBanner } from '@/components/yields/InversionBanner'

describe('InversionBanner', () => {
  it('renders when inverted is true', () => {
    render(<InversionBanner isInverted={true} spread={-0.23} daysSinceInversion={180} />)
    expect(screen.getByText(/倒掛/)).toBeInTheDocument()
    expect(screen.getByText(/180/)).toBeInTheDocument()
    expect(screen.getByText(/-0.23%/)).toBeInTheDocument()
  })

  it('renders nothing when inverted is false', () => {
    const { container } = render(
      <InversionBanner isInverted={false} spread={0.23} daysSinceInversion={0} />
    )
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/components/yields/InversionBanner.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Implement InversionBanner**

Create `src/components/yields/InversionBanner.tsx`:
```tsx
interface InversionBannerProps {
  isInverted: boolean
  spread: number         // 10Y - 2Y, negative when inverted
  daysSinceInversion: number
}

export function InversionBanner({ isInverted, spread, daysSinceInversion }: InversionBannerProps) {
  if (!isInverted) return null

  return (
    <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4 flex items-start gap-3">
      <span className="text-xl mt-0.5">⚠️</span>
      <div>
        <h4 className="text-sm font-semibold text-red-700">
          殖利率曲線倒掛中（2Y−10Y = {spread.toFixed(2)}%）
        </h4>
        <p className="text-xs text-red-500 mt-0.5">
          短端利率高於長端，歷史上常為景氣衰退前兆，已持續 {daysSinceInversion} 天
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/components/yields/InversionBanner.test.tsx --no-coverage
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/yields/InversionBanner.tsx src/__tests__/components/yields/InversionBanner.test.tsx
git commit -m "feat: add InversionBanner component"
```

---

## Task 11: YieldChart Component

**Files:**
- Create: `src/components/yields/YieldChart.tsx`
- Create: `src/__tests__/components/yields/YieldChart.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/components/yields/YieldChart.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YieldChart } from '@/components/yields/YieldChart'
import type { YieldDataPoint, MaturityKey, TimeRange } from '@/lib/types'

// Recharts renders SVG — mock it to avoid jsdom issues
jest.mock('recharts', () => {
  const React = require('react')
  return {
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ReferenceArea: () => null,
    Legend: () => null,
  }
})

const makeData = (maturity: MaturityKey): YieldDataPoint[] => [
  { date: '2024-01', value: 4.33 },
  { date: '2024-02', value: 4.45 },
]

describe('YieldChart', () => {
  const defaultProps = {
    seriesData: { '2Y': makeData('2Y'), '10Y': makeData('10Y') } as any,
    selectedMaturities: ['2Y', '10Y'] as MaturityKey[],
    onMaturityToggle: jest.fn(),
    timeRange: '5Y' as TimeRange,
    onTimeRangeChange: jest.fn(),
  }

  it('renders maturity toggle buttons for all 9 maturities', () => {
    render(<YieldChart {...defaultProps} />)
    const maturities = ['1M', '3M', '6M', '1Y', '2Y', '5Y', '10Y', '20Y', '30Y']
    maturities.forEach((m) => {
      expect(screen.getByRole('button', { name: m })).toBeInTheDocument()
    })
  })

  it('calls onMaturityToggle when a maturity button is clicked', async () => {
    render(<YieldChart {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: '5Y' }))
    expect(defaultProps.onMaturityToggle).toHaveBeenCalledWith('5Y')
  })

  it('shows selected maturities as filled blue buttons', () => {
    render(<YieldChart {...defaultProps} />)
    const btn2Y = screen.getByRole('button', { name: '2Y' })
    expect(btn2Y).toHaveClass('bg-blue-600')
  })

  it('renders time range buttons', () => {
    render(<YieldChart {...defaultProps} />)
    ;['1Y', '3Y', '5Y', '10Y', '20Y', 'MAX'].forEach((r) => {
      expect(screen.getByRole('button', { name: r })).toBeInTheDocument()
    })
  })

  it('calls onTimeRangeChange when time range is clicked', async () => {
    render(<YieldChart {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: '10Y' }))
    expect(defaultProps.onTimeRangeChange).toHaveBeenCalledWith('10Y')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/components/yields/YieldChart.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Implement YieldChart**

Create `src/components/yields/YieldChart.tsx`:
```tsx
'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceArea, ResponsiveContainer, Legend,
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

// Merge all series into one array keyed by date for Recharts
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
      <div className="flex flex-wrap gap-1.5 mb-3">
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
      <div className="flex gap-1 mb-3">
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/components/yields/YieldChart.test.tsx --no-coverage
```
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/yields/YieldChart.tsx src/__tests__/components/yields/YieldChart.test.tsx
git commit -m "feat: add YieldChart component with multi-line and maturity toggles"
```

---

## Task 12: SpreadChart Component

**Files:**
- Create: `src/components/yields/SpreadChart.tsx`
- Create: `src/__tests__/components/yields/SpreadChart.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/components/yields/SpreadChart.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { SpreadChart } from '@/components/yields/SpreadChart'
import type { YieldDataPoint } from '@/lib/types'

jest.mock('recharts', () => {
  const React = require('react')
  return {
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    ComposedChart: ({ children }: any) => <div data-testid="spread-chart">{children}</div>,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ReferenceLine: () => null,
    Cell: () => null,
  }
})

const twoYear: YieldDataPoint[] = [
  { date: '2024-01', value: 4.85 },
  { date: '2024-02', value: 4.90 },
]
const tenYear: YieldDataPoint[] = [
  { date: '2024-01', value: 4.62 },
  { date: '2024-02', value: 4.95 },
]

describe('SpreadChart', () => {
  it('renders the chart title', () => {
    render(<SpreadChart twoYearData={twoYear} tenYearData={tenYear} />)
    expect(screen.getByText(/10Y.*2Y/)).toBeInTheDocument()
  })

  it('renders the spread chart element', () => {
    render(<SpreadChart twoYearData={twoYear} tenYearData={tenYear} />)
    expect(screen.getByTestId('spread-chart')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/components/yields/SpreadChart.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Implement SpreadChart**

Create `src/components/yields/SpreadChart.tsx`:
```tsx
'use client'

import {
  ComposedChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import type { YieldDataPoint } from '@/lib/types'

interface SpreadChartProps {
  twoYearData: YieldDataPoint[]
  tenYearData: YieldDataPoint[]
}

function computeSpread(
  twoYear: YieldDataPoint[],
  tenYear: YieldDataPoint[]
): Array<{ date: string; spread: number }> {
  const tenMap = new Map(tenYear.map((d) => [d.date, d.value]))
  return twoYear
    .filter((d) => tenMap.has(d.date))
    .map((d) => ({
      date: d.date,
      spread: parseFloat((tenMap.get(d.date)! - d.value).toFixed(4)),
    }))
}

export function SpreadChart({ twoYearData, tenYearData }: SpreadChartProps) {
  const data = computeSpread(twoYearData, tenYearData)

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="text-sm font-semibold text-slate-800 mb-3">10Y − 2Y 利差（Spread）</div>
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
            formatter={(value: number) => [`${value.toFixed(2)}%`, '10Y−2Y 利差']}
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/components/yields/SpreadChart.test.tsx --no-coverage
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/yields/SpreadChart.tsx src/__tests__/components/yields/SpreadChart.test.tsx
git commit -m "feat: add SpreadChart component with red/blue bar coloring"
```

---

## Task 13: YieldTab Assembly

**Files:**
- Create: `src/components/yields/YieldTab.tsx`

- [ ] **Step 1: Implement YieldTab**

Create `src/components/yields/YieldTab.tsx`:
```tsx
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

  const two = yields['2Y']?.currentValue ?? 0
  const ten = yields['10Y']?.currentValue ?? 0
  const isInverted = two > 0 && ten > 0 && two > ten

  const data2Y = yields['2Y']?.data ?? []
  const data10Y = yields['10Y']?.data ?? []
  const inversionPeriods = computeInversionPeriods(data2Y, data10Y)
  const daysSince = isInverted ? calcDaysSinceInversion(data2Y, data10Y) : 0

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
        spread={ten - two}
        daysSinceInversion={daysSince}
      />

      <YieldChart
        seriesData={seriesData}
        selectedMaturities={selectedMaturities}
        onMaturityToggle={handleMaturityToggle}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        inversionPeriods={inversionPeriods}
      />

      <SpreadChart twoYearData={data2Y} tenYearData={data10Y} />
    </div>
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/yields/YieldTab.tsx
git commit -m "feat: add YieldTab with data fetching and assembly"
```

---

## Task 14: TimeRangeSelector Component

**Files:**
- Create: `src/components/stocks/TimeRangeSelector.tsx`
- Create: `src/__tests__/components/stocks/TimeRangeSelector.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/components/stocks/TimeRangeSelector.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimeRangeSelector } from '@/components/stocks/TimeRangeSelector'

describe('TimeRangeSelector', () => {
  it('renders all time range buttons', () => {
    render(<TimeRangeSelector value="5Y" onChange={jest.fn()} />)
    ;['1Y', '3Y', '5Y', '10Y', '20Y', 'MAX'].forEach((r) => {
      expect(screen.getByRole('button', { name: r })).toBeInTheDocument()
    })
  })

  it('highlights the active range', () => {
    render(<TimeRangeSelector value="10Y" onChange={jest.fn()} />)
    expect(screen.getByRole('button', { name: '10Y' })).toHaveClass('bg-blue-600')
    expect(screen.getByRole('button', { name: '5Y' })).not.toHaveClass('bg-blue-600')
  })

  it('calls onChange with clicked range', async () => {
    const onChange = jest.fn()
    render(<TimeRangeSelector value="5Y" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '20Y' }))
    expect(onChange).toHaveBeenCalledWith('20Y')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/components/stocks/TimeRangeSelector.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Implement TimeRangeSelector**

Create `src/components/stocks/TimeRangeSelector.tsx`:
```tsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/components/stocks/TimeRangeSelector.test.tsx --no-coverage
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/stocks/TimeRangeSelector.tsx src/__tests__/components/stocks/TimeRangeSelector.test.tsx
git commit -m "feat: add TimeRangeSelector component"
```

---

## Task 15: StockCard Component

**Files:**
- Create: `src/components/stocks/StockCard.tsx`
- Create: `src/__tests__/components/stocks/StockCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/components/stocks/StockCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { StockCard } from '@/components/stocks/StockCard'
import type { StockApiResponse } from '@/lib/types'

jest.mock('recharts', () => {
  const React = require('react')
  return {
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: ({ children }: any) => <div data-testid="mini-chart">{children}</div>,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
  }
})

const mockStock: StockApiResponse = {
  symbol: 'SPY',
  yahooSymbol: 'SPY',
  label: 'S&P 500 ETF',
  currentPrice: 568.2,
  changePercent: 1.23,
  history: [
    { date: '2024-01', price: 475.0 },
    { date: '2024-02', price: 500.0 },
  ],
  updatedAt: '2026-04-04T09:30:00Z',
}

describe('StockCard', () => {
  it('shows symbol and label', () => {
    render(<StockCard stock={mockStock} />)
    expect(screen.getByText('SPY')).toBeInTheDocument()
    expect(screen.getByText('S&P 500 ETF')).toBeInTheDocument()
  })

  it('shows current price', () => {
    render(<StockCard stock={mockStock} />)
    expect(screen.getByText(/568/)).toBeInTheDocument()
  })

  it('shows positive change in green with ▲', () => {
    render(<StockCard stock={mockStock} />)
    expect(screen.getByText(/▲/)).toBeInTheDocument()
    expect(screen.getByText(/▲/).closest('div')).toHaveClass('text-green-600')
  })

  it('shows negative change in red with ▼', () => {
    render(<StockCard stock={{ ...mockStock, changePercent: -0.5 }} />)
    expect(screen.getByText(/▼/)).toBeInTheDocument()
    expect(screen.getByText(/▼/).closest('div')).toHaveClass('text-red-600')
  })

  it('renders mini chart', () => {
    render(<StockCard stock={mockStock} />)
    expect(screen.getByTestId('mini-chart')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/components/stocks/StockCard.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Implement StockCard**

Create `src/components/stocks/StockCard.tsx`:
```tsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/components/stocks/StockCard.test.tsx --no-coverage
```
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/stocks/StockCard.tsx src/__tests__/components/stocks/StockCard.test.tsx
git commit -m "feat: add StockCard component with mini chart"
```

---

## Task 16: StockTab Assembly

**Files:**
- Create: `src/components/stocks/StockTab.tsx`

- [ ] **Step 1: Implement StockTab**

Create `src/components/stocks/StockTab.tsx`:
```tsx
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
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/stocks/StockTab.tsx
git commit -m "feat: add StockTab with data fetching and assembly"
```

---

## Task 17: Main Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement main page**

Replace `src/app/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { TabNav, type TabName } from '@/components/TabNav'
import { YieldTab } from '@/components/yields/YieldTab'
import { StockTab } from '@/components/stocks/StockTab'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabName>('yields')
  const updatedAt = new Date().toISOString()

  return (
    <main className="min-h-screen bg-slate-50">
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} updatedAt={updatedAt} />
      {activeTab === 'yields' ? <YieldTab /> : <StockTab />}
    </main>
  )
}
```

- [ ] **Step 2: Run the full test suite**

```bash
npx jest --no-coverage
```
Expected: All tests pass.

- [ ] **Step 3: Run dev server and manually verify**

```bash
npm run dev
```
Open http://localhost:3000. Verify:
- Tab navigation works
- 公債殖利率 tab loads yield cards and charts
- 股價追蹤 tab loads stock cards with mini charts
- Time range buttons update charts
- Maturity toggles add/remove lines from yield chart
- Inversion banner visible when 2Y > 10Y

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire up main page with tab navigation"
```

---

## Task 18: Deployment Config

**Files:**
- Create: `.env.example`
- Verify: `next.config.ts`

- [ ] **Step 1: Verify next.config.ts is minimal**

`next.config.ts` should be:
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```
No changes needed — Zeabur auto-detects Next.js.

- [ ] **Step 2: Confirm .env.example exists**

```bash
cat .env.example
```
Expected output:
```
FRED_API_KEY=your_fred_api_key_here
# Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html
```

- [ ] **Step 3: Final build check**

```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: add deployment config and verify production build"
```

- [ ] **Step 5: Push to GitHub and deploy to Zeabur**

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/finance-data-analysis.git
git push -u origin main
```
Then in Zeabur console:
1. New Project → Deploy from GitHub
2. Select `finance-data-analysis` repo
3. Add environment variable: `FRED_API_KEY=<your key>`
4. Click Deploy

---

## Self-Review Checklist

| Spec requirement | Covered in task |
|-----------------|-----------------|
| 公債殖利率 Tab | Task 9, 10, 11, 12, 13 |
| 殖利率卡片 (1M–30Y) | Task 9 |
| 倒掛 Banner | Task 10 |
| 殖利率折線圖 + 存續期間多選 | Task 11 |
| 藍色同色系，依選取數量分配 | Task 11 |
| 時間範圍 1Y/3Y/5Y/10Y/20Y/MAX | Task 11 |
| X 軸月份格式 YYYY-MM | Task 11 |
| 倒掛期間淡紅底色 | Task 11 |
| 10Y−2Y 利差圖 | Task 12 |
| 股價 Tab | Task 14, 15, 16 |
| 全域時間範圍切換 | Task 14 |
| SPY/BND/TSM/0050/2330 卡片 | Task 15 |
| 迷你走勢圖（實際價格） | Task 15 |
| 漲綠跌紅 | Task 15 |
| FRED API proxy | Task 4, 6 |
| Yahoo Finance proxy | Task 5, 7 |
| CORS 解決（API Routes） | Task 6, 7 |
| Zeabur 部署 | Task 18 |
| FRED_API_KEY 環境變數 | Task 1, 18 |
| 快取（yields 24h, stocks 15min） | Task 6, 7 |
