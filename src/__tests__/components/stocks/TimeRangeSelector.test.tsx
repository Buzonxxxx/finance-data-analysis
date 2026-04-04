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
