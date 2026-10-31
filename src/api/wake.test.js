import { describe, it, expect, vi } from 'vitest'
import { isColdStartError, withWakeRetry } from './wake'

const networkError = () => Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' })
const httpError = (status, data = '') => Object.assign(new Error(`HTTP ${status}`), { response: { status, data } })

describe('isColdStartError', () => {
  it('treats network errors and bare gateway errors as a sleeping server', () => {
    expect(isColdStartError(networkError())).toBe(true)
    expect(isColdStartError(httpError(502, '<html>bad gateway</html>'))).toBe(true)
    expect(isColdStartError(httpError(503))).toBe(true)
    expect(isColdStartError(httpError(504))).toBe(true)
  })

  it('does not retry the API’s own errors or cancelled requests', () => {
    expect(isColdStartError(httpError(503, { error: { code: 'checkout_unavailable' } }))).toBe(false)
    expect(isColdStartError(httpError(422, { error: { code: 'empty_file' } }))).toBe(false)
    expect(isColdStartError(httpError(429, { error: { code: 'rate_limited' } }))).toBe(false)
    expect(isColdStartError(httpError(404))).toBe(false)
    expect(isColdStartError(Object.assign(new Error('canceled'), { code: 'ERR_CANCELED' }))).toBe(false)
  })
})

describe('withWakeRetry', () => {
  const sleep = vi.fn(() => Promise.resolve())

  it('returns straight away when the server is awake', async () => {
    const onWaking = vi.fn()
    await expect(withWakeRetry(async () => 'ok', { onWaking, sleep })).resolves.toBe('ok')
    expect(onWaking).not.toHaveBeenCalled()
  })

  it('retries while the server wakes up and says so once', async () => {
    const onWaking = vi.fn()
    const request = vi.fn()
      .mockRejectedValueOnce(networkError())
      .mockRejectedValueOnce(httpError(502))
      .mockResolvedValueOnce('report')
    await expect(withWakeRetry(request, { onWaking, sleep, delaysMs: [1, 1, 1] })).resolves.toBe('report')
    expect(request).toHaveBeenCalledTimes(3)
    expect(onWaking).toHaveBeenCalledTimes(1)
  })

  it('gives up after the last delay', async () => {
    const request = vi.fn().mockRejectedValue(networkError())
    await expect(withWakeRetry(request, { sleep, delaysMs: [1, 1] })).rejects.toThrow('Network Error')
    expect(request).toHaveBeenCalledTimes(3)
  })

  it('does not retry real API errors', async () => {
    const request = vi.fn().mockRejectedValue(httpError(422, { error: { code: 'empty_file' } }))
    await expect(withWakeRetry(request, { sleep })).rejects.toThrow('HTTP 422')
    expect(request).toHaveBeenCalledTimes(1)
  })
})
