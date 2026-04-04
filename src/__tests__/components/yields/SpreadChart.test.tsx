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
