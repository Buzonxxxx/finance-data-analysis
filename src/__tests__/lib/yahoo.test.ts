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
