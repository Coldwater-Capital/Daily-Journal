import { render, screen } from '@testing-library/react'
import SaveIndicator from '@/components/ui/SaveIndicator'

describe('SaveIndicator', () => {
  it('renders nothing when idle', () => {
    const { container } = render(<SaveIndicator status="idle" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows saving text', () => {
    render(<SaveIndicator status="saving" />)
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('shows saved text', () => {
    render(<SaveIndicator status="saved" />)
    expect(screen.getByText('✓ Saved')).toBeInTheDocument()
  })
})
