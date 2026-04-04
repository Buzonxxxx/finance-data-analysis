import { render, screen } from '@testing-library/react'
import { InversionBanner } from '@/components/yields/InversionBanner'

describe('InversionBanner', () => {
  it('renders when inverted is true', () => {
    render(<InversionBanner isInverted={true} spread={-0.23} daysSinceInversion={180} />)
    expect(screen.getByText(/倒掛/)).toBeInTheDocument()
    expect(screen.getByText(/180/)).toBeInTheDocument()
    expect(screen.getByText(/-0.23%/)).toBeInTheDocument()
  })

  it('renders nothing when inverted is false', () => {
    const { container } = render(
      <InversionBanner isInverted={false} spread={0.23} daysSinceInversion={0} />
    )
    expect(container.firstChild).toBeNull()
  })
})
