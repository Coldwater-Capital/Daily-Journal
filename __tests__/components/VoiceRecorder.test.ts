import { processTranscript } from '@/components/journal/VoiceRecorder'

describe('processTranscript', () => {
  it('capitalises the first letter', () => {
    expect(processTranscript('hello world')).toBe('Hello world')
  })

  it('replaces spoken period with punctuation', () => {
    expect(processTranscript('hello period')).toBe('Hello.')
  })

  it('replaces spoken comma', () => {
    expect(processTranscript('hello comma world')).toBe('Hello, world')
  })

  it('replaces spoken question mark', () => {
    expect(processTranscript('is anyone there question mark')).toBe('Is anyone there?')
  })

  it('replaces spoken exclamation point', () => {
    expect(processTranscript('wow exclamation point')).toBe('Wow!')
  })

  it('replaces spoken exclamation mark', () => {
    expect(processTranscript('wow exclamation mark')).toBe('Wow!')
  })

  it('replaces spoken colon', () => {
    expect(processTranscript('note colon remember this')).toBe('Note: remember this')
  })

  it('replaces spoken new line', () => {
    expect(processTranscript('line one new line line two')).toBe('Line one\nline two')
  })

  it('replaces spoken new paragraph', () => {
    expect(processTranscript('para one new paragraph para two')).toBe('Para one\n\npara two')
  })

  it('capitalises after sentence-ending punctuation within a fragment', () => {
    expect(processTranscript('hello period how are you')).toBe('Hello. How are you')
  })

  it('handles case-insensitive spoken punctuation', () => {
    expect(processTranscript('hello PERIOD world')).toBe('Hello. World')
  })

  it('trims leading and trailing whitespace', () => {
    expect(processTranscript('  hello world  ')).toBe('Hello world')
  })

  it('returns empty string unchanged (after trim + capitalise)', () => {
    expect(processTranscript('')).toBe('')
  })
})
