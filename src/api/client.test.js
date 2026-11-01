import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiBaseUrl, isLocalApi } from './client'

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

describe('isLocalApi', () => {
  it('is true for the dev proxy and an API on this computer', () => {
    expect(isLocalApi(undefined)).toBe(true)
    expect(isLocalApi('')).toBe(true)
    expect(isLocalApi('http://localhost:3000')).toBe(true)
    expect(isLocalApi('http://127.0.0.1:3000/api')).toBe(true)
    expect(isLocalApi('http://[::1]:3000')).toBe(true)
  })

  it('is false for a hosted API', () => {
    expect(isLocalApi('https://browsewrapped-api.fly.dev')).toBe(false)
    expect(isLocalApi('https://localhost.example.com')).toBe(false)
    expect(isLocalApi('not a url')).toBe(false)
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
  // Records the method, URL, headers and body axios sends, and answers with
  // `response` (status + JSON) so the call resolves.
  async function captured(call, response = { status: 204, body: '' }) {
    const request = { headers: {} }
    vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(function (method, url) {
      Object.assign(request, { method, url })
    })
    vi.spyOn(XMLHttpRequest.prototype, 'setRequestHeader').mockImplementation(function (name, value) {
      request.headers[name] = value
    })
    vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(function (body) {
      request.body = body
      Object.defineProperty(this, 'readyState', { value: 4 })
      Object.defineProperty(this, 'status', { value: response.status })
      Object.defineProperty(this, 'responseText', { value: response.body })
      Object.defineProperty(this, 'response', { value: response.body })
      Object.defineProperty(this, 'getAllResponseHeaders', { value: () => 'content-type: application/json' })
      queueMicrotask(() => this.onloadend ? this.onloadend() : this.onreadystatechange?.())
    })
    const result = await call()
    return { request, result }
  }

  it('deletes an analysis with its delete token in the X-Delete-Token header', async () => {
    vi.stubEnv('VITE_API_URL', '')
    const client = await import('./client')
    const { request } = await captured(() => client.deleteAnalysis('42', 'secret-token'))
    expect(request.method).toBe('DELETE')
    expect(request.url).toBe('/api/v1/analyses/42')
    expect(request.headers['X-Delete-Token']).toBe('secret-token')
  })
  it('sends the share card as multipart, with the report as a JSON string', async () => {
    vi.stubEnv('VITE_API_URL', '')
    const client = await import('./client')
    const card = new Blob(['png'], { type: 'image/png' })
    const { request } = await captured(
      () => client.createShareLink({ report: { persona: { title: 'The Builder' } }, card }),
      { status: 201, body: JSON.stringify({ token: 'tok', preview_url: 'https://api/s/tok' }) },
    )
    expect(request.method).toBe('POST')
    expect(request.url).toBe('/api/v1/shared_reports')
    expect(request.body).toBeInstanceOf(FormData)
    expect(JSON.parse(request.body.get('report'))).toEqual({ persona: { title: 'The Builder' } })
    expect(request.body.get('card')).toBeInstanceOf(Blob)
    expect(request.body.get('card').name).toBe('card.png')
    expect(request.body.has('analysis_id')).toBe(false)
  })

  it('keeps the plain JSON body for shares without a card', async () => {
    vi.stubEnv('VITE_API_URL', '')
    const client = await import('./client')
    const { request } = await captured(() => client.createShareLink({ analysisId: '42' }), { status: 201, body: '{}' })
    expect(JSON.parse(request.body)).toEqual({ analysis_id: '42' })
  })
})
