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
