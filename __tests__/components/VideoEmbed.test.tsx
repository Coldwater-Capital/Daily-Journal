import { render } from '@testing-library/react'
import VideoEmbed from '@/components/journal/VideoEmbed'

describe('VideoEmbed', () => {
  it('renders an iframe for a valid YouTube URL', () => {
    render(<VideoEmbed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />)
    const iframe = document.querySelector('iframe')
    expect(iframe).toBeInTheDocument()
    expect(iframe?.src).toContain('youtube.com/embed/dQw4w9WgXcQ')
  })

  it('renders an iframe for a Vimeo URL', () => {
    render(<VideoEmbed url="https://vimeo.com/76979871" />)
    const iframe = document.querySelector('iframe')
    expect(iframe).toBeInTheDocument()
    expect(iframe?.src).toContain('player.vimeo.com/video/76979871')
  })

  it('renders an iframe for a Loom URL', () => {
    render(<VideoEmbed url="https://www.loom.com/share/abc123" />)
    const iframe = document.querySelector('iframe')
    expect(iframe).toBeInTheDocument()
    expect(iframe?.src).toContain('loom.com/embed/abc123')
  })

  it('renders nothing for an empty URL', () => {
    const { container } = render(<VideoEmbed url="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for an unrecognised URL', () => {
    const { container } = render(<VideoEmbed url="https://www.example.com/video" />)
    expect(container).toBeEmptyDOMElement()
  })
})
