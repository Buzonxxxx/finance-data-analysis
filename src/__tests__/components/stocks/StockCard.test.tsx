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
