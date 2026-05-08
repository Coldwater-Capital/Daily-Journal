import { getEmbedUrl, formatDateDisplay } from '@/lib/utils'

describe('getEmbedUrl', () => {
  describe('YouTube', () => {
    it('handles standard watch URL', () => {
      expect(getEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
        .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
    })

    it('handles watch URL with extra params', () => {
      expect(getEmbedUrl('https://www.youtube.com/watch?si=abc123&v=dQw4w9WgXcQ'))
        .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
    })

    it('handles short youtu.be link', () => {
      expect(getEmbedUrl('https://youtu.be/dQw4w9WgXcQ'))
        .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
    })

    it('handles youtu.be link with tracking params', () => {
      expect(getEmbedUrl('https://youtu.be/dQw4w9WgXcQ?si=abc123'))
        .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
    })

    it('handles Shorts URL', () => {
      expect(getEmbedUrl('https://www.youtube.com/shorts/abc123XYZ'))
        .toBe('https://www.youtube.com/embed/abc123XYZ')
    })

    it('handles Live URL', () => {
      expect(getEmbedUrl('https://www.youtube.com/live/abc123XYZ'))
        .toBe('https://www.youtube.com/embed/abc123XYZ')
    })
  })

  describe('Vimeo', () => {
    it('handles standard Vimeo URL', () => {
      expect(getEmbedUrl('https://vimeo.com/76979871'))
        .toBe('https://player.vimeo.com/video/76979871')
    })
  })

  describe('Loom', () => {
    it('handles Loom share URL', () => {
      expect(getEmbedUrl('https://www.loom.com/share/abc123def456'))
        .toBe('https://www.loom.com/embed/abc123def456')
    })

    it('handles Loom share URL with query params', () => {
      expect(getEmbedUrl('https://www.loom.com/share/abc123def456?sid=xyz'))
        .toBe('https://www.loom.com/embed/abc123def456')
    })
  })

  describe('invalid URLs', () => {
    it('returns null for empty string', () => {
      expect(getEmbedUrl('')).toBeNull()
    })

    it('returns null for plain text', () => {
      expect(getEmbedUrl('not a url')).toBeNull()
    })

    it('returns null for unrecognised video site', () => {
      expect(getEmbedUrl('https://www.dailymotion.com/video/abc')).toBeNull()
    })

    it('returns null for a YouTube channel URL (no video ID)', () => {
      expect(getEmbedUrl('https://www.youtube.com/@someChannel')).toBeNull()
    })
  })
})

describe('formatDateDisplay', () => {
  it('formats a known date correctly', () => {
    expect(formatDateDisplay('2026-05-08')).toBe('Friday, May 8, 2026')
  })

  it('formats the first day of the year', () => {
    expect(formatDateDisplay('2026-01-01')).toBe('Thursday, January 1, 2026')
  })

  it('formats the last day of the year', () => {
    expect(formatDateDisplay('2025-12-31')).toBe('Wednesday, December 31, 2025')
  })
})
