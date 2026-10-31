import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Vitest runs from the project root.
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
const doc = new DOMParser().parseFromString(html, 'text/html')
const meta = (attr, name) => doc.querySelector(`meta[${attr}="${name}"]`)?.getAttribute('content')

describe('index.html link-preview defaults', () => {
  it('has a description, Open Graph and Twitter tags with the static 1200×630 image', () => {
    expect(meta('name', 'description')).toMatch(/browser history/)
    expect(meta('property', 'og:title')).toBeTruthy()
    expect(meta('property', 'og:description')).toBeTruthy()
    expect(meta('property', 'og:image')).toBe('%SITE_URL%/og-image.png')
    expect([meta('property', 'og:image:width'), meta('property', 'og:image:height')]).toEqual(['1200', '630'])
    expect(meta('name', 'twitter:card')).toBe('summary_large_image')
    expect(meta('name', 'twitter:image')).toBe('%SITE_URL%/og-image.png')
  })

  it('ships the fallback image at 1200×630', () => {
    const png = readFileSync(resolve(process.cwd(), 'public/og-image.png'))
    expect(png.subarray(1, 4).toString()).toBe('PNG')
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
    expect(png.length).toBeLessThan(300 * 1024)
  })
})
