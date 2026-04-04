/**
 * @jest-environment node
 */

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
    expect(data.updatedAt).toBeDefined()
  })

  it('returns 400 for unknown symbol', async () => {
    const req = new NextRequest(
      'http://localhost/api/stocks?symbol=UNKNOWN&range=5Y'
    )
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})
