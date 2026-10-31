import { describe, it, expect } from 'vitest'
import { textTint } from './color'

// WCAG relative luminance contrast, to prove the tint is readable.
function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

describe('textTint', () => {
  it('lightens a colour towards white', () => {
    expect(textTint('#000000', 0.5)).toBe('#808080')
    expect(textTint('#6366f1')).toBe('#9a9cf6')
  })

  it('makes the darkest topic colours readable on the card surface', () => {
    for (const hex of ['#6366f1', '#475569', '#8b5cf6', '#a855f7', '#ec4899']) {
      expect(contrast(textTint(hex), '#13132a')).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('falls back to the text colour for anything that is not a hex colour', () => {
    expect(textTint(undefined)).toBe('var(--text)')
    expect(textTint('red')).toBe('var(--text)')
  })
})
