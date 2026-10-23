import { describe, it, expect } from 'vitest'
import { detectBrowser, detectOS, orderedPaths } from './exportGuide'

// Real user-agent strings, trimmed only where noted.
const UA = {
  chromeMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  chromeWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  chromeIOS: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.0.0 Mobile/15E148 Safari/604.1',
  edgeWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
  firefoxLinux: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0',
  firefoxMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
  safariIPhone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  opera: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0',
  samsung: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
}

describe('detectBrowser', () => {
  it('recognises the browsers that have a guide tab', () => {
    expect(detectBrowser(UA.chromeMac)).toBe('chrome')
    expect(detectBrowser(UA.chromeWin)).toBe('chrome')
    expect(detectBrowser(UA.chromeIOS)).toBe('chrome')
    expect(detectBrowser(UA.chromeAndroid)).toBe('chrome')
    expect(detectBrowser(UA.firefoxLinux)).toBe('firefox')
    expect(detectBrowser(UA.safariMac)).toBe('safari')
    expect(detectBrowser(UA.safariIPhone)).toBe('safari')
  })

  it('does not mistake Edge or Opera for Chrome (both also say "Chrome")', () => {
    expect(detectBrowser(UA.edgeWin)).toBe('edge')
    expect(detectBrowser(UA.opera)).toBe('other')
    expect(detectBrowser(UA.samsung)).toBe('other')
  })

  it('falls back to "other" for unknown or missing strings', () => {
    expect(detectBrowser('curl/8.5.0')).toBe('other')
    expect(detectBrowser('')).toBe('other')
    expect(detectBrowser(undefined)).toBe('other')
  })
})

describe('detectOS', () => {
  it('finds the desktop system', () => {
    expect(detectOS(UA.chromeMac)).toBe('mac')
    expect(detectOS(UA.firefoxMac)).toBe('mac')
    expect(detectOS(UA.edgeWin)).toBe('windows')
    expect(detectOS(UA.firefoxLinux)).toBe('linux')
  })

  it('returns null for phones, which have no history file to upload', () => {
    expect(detectOS(UA.safariIPhone)).toBeNull()
    expect(detectOS(UA.chromeAndroid)).toBeNull()
  })
})

describe('orderedPaths', () => {
  const paths = { mac: 'm', windows: 'w', linux: 'l' }

  it('lists the visitor’s system first and keeps the rest in order', () => {
    expect(orderedPaths(paths, 'linux').map((p) => p.os)).toEqual(['linux', 'mac', 'windows'])
    expect(orderedPaths(paths, 'windows').map((p) => p.os)).toEqual(['windows', 'mac', 'linux'])
    expect(orderedPaths(paths, null).map((p) => p.os)).toEqual(['mac', 'windows', 'linux'])
  })

  it('skips systems without a location', () => {
    expect(orderedPaths({ mac: '~/Library/Safari/History.db' }, 'windows')).toEqual([{ os: 'mac', path: '~/Library/Safari/History.db' }])
    expect(orderedPaths(undefined)).toEqual([])
  })
})
