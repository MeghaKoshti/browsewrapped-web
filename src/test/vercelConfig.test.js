import { describe, it, expect } from 'vitest'
import vercel from '../../vercel.json'
import { GUIDES } from '../lib/seo'

// vercel.json is only read by Vercel, so guard the parts the app relies on.
const matches = (source, path) => new RegExp(`^${source}$`).test(path)
const headersFor = (path) => Object.fromEntries(
  vercel.headers.filter((h) => matches(h.source, path)).flatMap((h) => h.headers.map((x) => [x.key, x.value])),
)
const directives = (csp) => Object.fromEntries(csp.split(';').map((d) => d.trim().split(/\s+/)).map(([name, ...values]) => [name, values]))

describe('vercel.json', () => {
  it('serves index.html for client-side routes so deep links work', () => {
    const rewrite = vercel.rewrites.at(-1)
    expect(rewrite.destination).toBe('/index.html')
    for (const path of ['/', '/results', '/r/abc123', '/analyses/42']) expect(matches(rewrite.source, path)).toBe(true)
    expect(matches(rewrite.source, '/api/v1/sample')).toBe(false)
  })

  it('serves the prerendered guide HTML at /guide/<browser>, before the SPA fallback', () => {
    const [guide] = vercel.rewrites
    expect(guide.destination).toBe('/guide/:browser/index.html')
    expect(guide.source.match(/\((.*)\)/)[1].split('|').sort()).toEqual(GUIDES.map((g) => g.id).sort())
  })

  it('sends the security headers on every page', () => {
    const headers = headersFor('/r/abc123')
    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['Content-Security-Policy']).toBeTruthy()
  })

  it('has a CSP that allows the app, the API, Google Fonts and the PNG export, and nothing inline', () => {
    const csp = directives(headersFor('/')['Content-Security-Policy'])
    expect(csp['default-src']).toEqual(["'self'"])
    expect(csp['script-src']).toEqual(["'self'"])
    expect(csp['img-src']).toEqual(["'self'", 'data:', 'blob:'])
    expect(csp['connect-src'][0]).toBe("'self'")
    expect(csp['connect-src'][1]).toBe('https://browsewrapped-api.onrender.com')
    expect(headersFor('/')['Content-Security-Policy']).not.toContain('CHANGE-ME')
    expect(csp['style-src']).not.toContain("'unsafe-inline'")
    expect(csp['frame-ancestors']).toEqual(["'none'"])
  })

  it('caches hashed build assets for a year', () => {
    expect(headersFor('/assets/index-abc123.js')['Cache-Control']).toContain('immutable')
    expect(headersFor('/index.html')['Cache-Control']).toBeUndefined()
  })
})
