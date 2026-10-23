import { describe, it, expect } from 'vitest'
import { errorMessage } from './errorMessage'

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
    expect(errorMessage(apiError(429, {}))).toBe('Too many requests right now. Please wait a minute and try again.')
  })

  it('uses friendly copy for files that are too large or the wrong type', () => {
    expect(errorMessage(apiError(413, { error: { code: 'payload_too_large', message: 'Payload Too Large' } }))).toMatch(/too big/)
    expect(errorMessage(apiError(413, ''))).toMatch(/too big/)
    expect(errorMessage(apiError(415, { error: { code: 'unsupported_media_type', message: 'Unsupported' } }))).toMatch(/JSON or CSV/)
    expect(errorMessage(apiError(415, { error: 'Unsupported Media Type' }))).toMatch(/JSON or CSV/)
  })
})
