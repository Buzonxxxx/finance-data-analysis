import { render, screen, within } from '@testing-library/react'
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
    const maturityGroup = screen.getByRole('group', { name: /maturity/i })
    maturities.forEach((m) => {
      expect(within(maturityGroup).getByRole('button', { name: m })).toBeInTheDocument()
    })
  })

  it('calls onMaturityToggle when a maturity button is clicked', async () => {
    render(<YieldChart {...defaultProps} />)
    const maturityGroup = screen.getByRole('group', { name: /maturity/i })
    await userEvent.click(within(maturityGroup).getByRole('button', { name: '5Y' }))
    expect(defaultProps.onMaturityToggle).toHaveBeenCalledWith('5Y')
  })

  it('shows selected maturities as filled blue buttons', () => {
    render(<YieldChart {...defaultProps} />)
    const btn2Y = screen.getByRole('button', { name: '2Y' })
    expect(btn2Y).toHaveClass('bg-blue-600')
  })

  it('renders time range buttons', () => {
    render(<YieldChart {...defaultProps} />)
    const timeRangeGroup = screen.getByRole('group', { name: /time range/i })
    ;['1Y', '3Y', '5Y', '10Y', '20Y', 'MAX'].forEach((r) => {
      expect(within(timeRangeGroup).getByRole('button', { name: r })).toBeInTheDocument()
    })
  })

  it('calls onTimeRangeChange when time range is clicked', async () => {
    render(<YieldChart {...defaultProps} />)
    const timeRangeGroup = screen.getByRole('group', { name: /time range/i })
    await userEvent.click(within(timeRangeGroup).getByRole('button', { name: '10Y' }))
    expect(defaultProps.onTimeRangeChange).toHaveBeenCalledWith('10Y')
  })
})
