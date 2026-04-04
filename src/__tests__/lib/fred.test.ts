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
    expect(calledUrl).toContain('file_type=json')
    expect(calledUrl).toContain('observation_end=2024-04-30')
    expect(calledUrl).toContain('sort_order=asc')
  })

  it('throws on HTTP error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429 } as Response)
    await expect(
      fetchFredSeries('DGS10', '2024-01-01', '2024-04-30', 'test-key')
    ).rejects.toThrow('FRED API error: 429')
  })
})
