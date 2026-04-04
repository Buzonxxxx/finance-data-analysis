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
