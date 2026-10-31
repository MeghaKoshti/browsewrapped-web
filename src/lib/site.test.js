import { describe, it, expect } from 'vitest'
import { publicSiteUrl, siteDomain } from './site'

describe('site address', () => {
  it('prefers VITE_PUBLIC_URL, then the current origin', () => {
    expect(publicSiteUrl('https://browsewrapped.app/', 'http://localhost:5173')).toBe('https://browsewrapped.app')
    expect(publicSiteUrl('', 'http://localhost:5173')).toBe('http://localhost:5173')
  })

  it('prints a bare domain', () => {
    expect(siteDomain('https://www.browsewrapped.app/')).toBe('browsewrapped.app')
    expect(siteDomain('http://localhost:5173')).toBe('localhost:5173')
    expect(siteDomain('not a url')).toBe('')
  })
})
