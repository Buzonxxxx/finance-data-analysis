/**
 * @jest-environment node
 */
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
    expect(data.updatedAt).toBeDefined()
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
