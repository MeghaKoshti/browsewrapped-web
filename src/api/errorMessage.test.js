import { describe, it, expect } from 'vitest'
import { errorMessage, retryAfterSeconds, formatWait } from './errorMessage'

const apiError = (status, data, headers = {}) => ({ response: { status, data, headers } })

describe('errorMessage', () => {
  it('reads the new { error: { code, message } } shape', () => {
    const err = apiError(422, { error: { code: 'empty_file', message: 'The file is empty.' }, error_message: 'The file is empty.' })
    expect(errorMessage(err)).toBe('The file is empty.')
  })

  it('falls back to error_message when error has no message', () => {
    expect(errorMessage(apiError(422, { error: { code: 'missing_file' }, error_message: 'No file was uploaded.' }))).toBe('No file was uploaded.')
  })

  it('still reads the old { error: "..." } string shape', () => {
    expect(errorMessage(apiError(422, { error: 'Unsupported file format' }))).toBe('Unsupported file format')
  })

  it('never returns an object, even for unexpected bodies', () => {
    expect(errorMessage(apiError(500, { error: { code: 'boom' } }), 'Fallback')).toBe('Fallback')
    expect(errorMessage(apiError(500, '<html>oops</html>'), 'Fallback')).toBe('Fallback')
    expect(errorMessage(new Error('Network Error'), 'Fallback')).toBe('Fallback')
    expect(errorMessage(undefined)).toBe('Something went wrong. Please try again.')
  })

  it('uses friendly copy for rate limiting, with Retry-After', () => {
    const err = apiError(429, { error: { code: 'rate_limited', message: 'Rate limit exceeded' } }, { 'retry-after': '60' })
    expect(errorMessage(err)).toBe('Too many requests right now. Please wait 60 seconds and try again.')
    expect(errorMessage(apiError(429, {}))).toBe('Too many requests right now. Please wait 60 seconds and try again.')
  })

  it('uses a long Retry-After as given instead of capping it', () => {
    const err = apiError(429, { error: { code: 'rate_limited' } }, { 'retry-after': '300' })
    expect(errorMessage(err)).toBe('Too many requests right now. Please wait 5 minutes and try again.')
  })
})

describe('retryAfterSeconds', () => {
  const now = Date.parse('2026-10-23T12:00:00Z')

  it('reads a number of seconds', () => {
    expect(retryAfterSeconds('120', now)).toBe(120)
    expect(retryAfterSeconds(' 5 ', now)).toBe(5)
  })

  it('reads an HTTP date relative to now', () => {
    expect(retryAfterSeconds('Fri, 23 Oct 2026 12:02:30 GMT', now)).toBe(150)
    expect(retryAfterSeconds('Fri, 23 Oct 2026 12:00:00 GMT', now + 400)).toBe(60) // already passed
  })

  it('falls back to 60 seconds when the header is missing or unreadable', () => {
    for (const header of [undefined, null, '', '0', '-5', '1.5', 'soon']) {
      expect(retryAfterSeconds(header, now)).toBe(60)
    }
  })
})

describe('formatWait', () => {
  it('picks a readable unit', () => {
    expect(formatWait(1)).toBe('1 second')
    expect(formatWait(90)).toBe('90 seconds')
    expect(formatWait(91)).toBe('2 minutes')
    expect(formatWait(3600)).toBe('60 minutes')
    expect(formatWait(5400)).toBe('2 hours')
  })

  it('uses friendly copy for files that are too large or the wrong type', () => {
    expect(errorMessage(apiError(413, { error: { code: 'payload_too_large', message: 'Payload Too Large' } }))).toMatch(/too big/)
    expect(errorMessage(apiError(413, ''))).toMatch(/too big/)
    expect(errorMessage(apiError(415, { error: { code: 'unsupported_media_type', message: 'Unsupported' } }))).toMatch(/JSON or CSV/)
    expect(errorMessage(apiError(415, { error: 'Unsupported Media Type' }))).toMatch(/JSON or CSV/)
  })

  it('explains SQLite uploads that are not browser history or are damaged', () => {
    const notHistory = apiError(415, { error: { code: 'unsupported_sqlite', message: 'Unsupported SQLite database' } })
    expect(errorMessage(notHistory)).toMatch(/isn’t a browser history file.*places\.sqlite.*History\.db/)

    const corrupt = apiError(422, { error: { code: 'corrupt_sqlite', message: 'Database disk image is malformed' } })
    expect(errorMessage(corrupt)).toMatch(/looks incomplete.*Quit the browser, copy the file again/)
  })
})
