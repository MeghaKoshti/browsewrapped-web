import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiBaseUrl } from './client'

describe('apiBaseUrl', () => {
  it('uses the /api dev proxy when VITE_API_URL is not set', () => {
    expect(apiBaseUrl(undefined)).toBe('/api')
    expect(apiBaseUrl('')).toBe('/api')
    expect(apiBaseUrl('  ')).toBe('/api')
  })

  it('accepts the API origin with or without /api and trailing slashes', () => {
    expect(apiBaseUrl('https://browsewrapped-api.fly.dev')).toBe('https://browsewrapped-api.fly.dev/api')
    expect(apiBaseUrl('https://browsewrapped-api.fly.dev/')).toBe('https://browsewrapped-api.fly.dev/api')
    expect(apiBaseUrl('https://browsewrapped-api.fly.dev/api')).toBe('https://browsewrapped-api.fly.dev/api')
    expect(apiBaseUrl('https://browsewrapped-api.fly.dev/api/')).toBe('https://browsewrapped-api.fly.dev/api')
  })
})

describe('API client requests', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  // Records the URL axios opens without sending anything.
  async function requestedUrl(call) {
    const open = vi.spyOn(XMLHttpRequest.prototype, 'open')
    vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => {})
    call()
    await vi.waitFor(() => expect(open).toHaveBeenCalled())
    return open.mock.calls[0][1]
  }

  it('calls the same-origin /api path by default', async () => {
    vi.stubEnv('VITE_API_URL', '')
    const client = await import('./client')
    expect(await requestedUrl(() => client.fetchSampleReport())).toBe('/api/v1/sample')
  })

  it('calls the API origin from VITE_API_URL in production builds', async () => {
    vi.stubEnv('VITE_API_URL', 'https://browsewrapped-api.fly.dev')
    const client = await import('./client')
    expect(await requestedUrl(() => client.getSharedReport('tok'))).toBe('https://browsewrapped-api.fly.dev/api/v1/shared_reports/tok')
  })
})
