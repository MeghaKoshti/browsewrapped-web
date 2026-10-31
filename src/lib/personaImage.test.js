import { describe, it, expect, vi } from 'vitest'
import {
  buildPersonaCardData, personaCardFilename, wrapText, drawPersonaCard, renderPersonaCardPng, drawOgCard, OG_WIDTH, OG_HEIGHT,
} from './personaImage'
import report from '../test/fixtures/report.json'

// A stand-in 2D context that records text and counts calls. Every char is
// 10px wide so wrapping is predictable.
function fakeContext() {
  const texts = []
  const gradient = { addColorStop: vi.fn() }
  const ctx = new Proxy({ texts }, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (prop === 'fillText') return (t) => texts.push(String(t))
      if (prop === 'measureText') return (t) => ({ width: String(t).length * 10 })
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => gradient
      return () => {}
    },
    set(target, prop, value) { target[prop] = value; return true },
  })
  return ctx
}

describe('buildPersonaCardData', () => {
  it('picks the persona, top topics and key stats', () => {
    const data = buildPersonaCardData(report)

    expect(data.title).toBe('The Builder')
    expect(data.color).toBe('#6366f1')
    expect(data.year).toBe('2026')
    expect(data.dateRange).toBe('Aug 2, 2026 – Sep 30, 2026')
    expect(data.stats).toEqual([
      { label: 'Visits', value: '1.5k' },
      { label: 'Hours browsed', value: '25.4h' },
      { label: 'Longest streak', value: '11 days' },
    ])
    expect(data.topTopics.map((t) => t.name)).toEqual(['Programming', 'AI & ML', 'Tech News', 'Entertainment'])
  })

  it('carries the public site domain for the footer watermark', () => {
    expect(buildPersonaCardData(report, { site: 'browsewrapped.app' }).site).toBe('browsewrapped.app')
  })

  it('never includes domains, URLs, page titles or searches', () => {
    const json = JSON.stringify(buildPersonaCardData(report))
    for (const secret of ['github.com', 'stackoverflow', 'https://', 'rails/rails', 'solid queue']) {
      expect(json).not.toContain(secret)
    }
  })

  it('falls back when hours and streaks are missing', () => {
    const data = buildPersonaCardData({
      ...report,
      summary: { ...report.summary, total_hours_browsed: 0, date_range: null },
      streaks: null,
    })
    expect(data.stats.map((s) => s.label)).toEqual(['Visits', 'Sites explored', 'Days tracked'])
    expect(data.dateRange).toBe('')
  })

  it('returns null without a persona and ignores unsafe colours', () => {
    expect(buildPersonaCardData({ ...report, persona: null })).toBeNull()
    expect(buildPersonaCardData({ ...report, persona: { ...report.persona, color: 'red;}' } }).color).toBe('#a855f7')
  })
})

describe('personaCardFilename', () => {
  it('builds a readable file name', () => {
    expect(personaCardFilename({ title: 'The AI Pioneer!', year: '2026' })).toBe('browsewrapped-the-ai-pioneer-2026.png')
  })
})

describe('wrapText', () => {
  const measure = (t) => t.length * 10

  it('wraps words to the width', () => {
    expect(wrapText('one two three four', 90, measure)).toEqual(['one two', 'three', 'four'])
  })

  it('adds an ellipsis when it runs out of lines', () => {
    expect(wrapText('one two three four five', 90, measure, 2)).toEqual(['one two', 'three…'])
  })

  it('keeps a single long word on its own line', () => {
    expect(wrapText('extraordinarily', 50, measure)).toEqual(['extraordinarily'])
  })
})

describe('drawPersonaCard', () => {
  it('draws the persona, stats, topics and the BrowseWrapped mark', () => {
    const ctx = fakeContext()
    drawPersonaCard(ctx, buildPersonaCardData(report))

    expect(ctx.texts).toEqual(expect.arrayContaining([
      'B R O W S E W R A P P E D', '2026 WRAPPED', 'YOU ARE', 'The Builder',
      '1.5k', 'VISITS', '25.4h', '11 days', 'TOP TOPICS', 'Programming', '39.6%',
      'Aug 2, 2026 – Sep 30, 2026',
    ]))
  })
})

describe('persona card watermark', () => {
  it('prints the site domain next to the date range', () => {
    const ctx = fakeContext()
    drawPersonaCard(ctx, buildPersonaCardData(report, { site: 'browsewrapped.app' }))
    expect(ctx.texts).toEqual(expect.arrayContaining(['Aug 2, 2026 – Sep 30, 2026', 'browsewrapped.app']))
  })
})

describe('drawOgCard', () => {
  it('draws the 1200×630 link-preview card with the persona, topics and site', () => {
    const ctx = fakeContext()
    drawOgCard(ctx, buildPersonaCardData(report, { site: 'browsewrapped.app' }))
    expect(ctx.texts).toEqual(expect.arrayContaining(['YOU ARE', 'The Builder', 'TOP TOPICS', 'Programming', '39.6%', 'browsewrapped.app']))
    expect([OG_WIDTH, OG_HEIGHT]).toEqual([1200, 630])
  })

  it('draws its glow without a radial gradient, which Chromium dithers into a PNG over the 300 KB cap', () => {
    const ctx = fakeContext()
    const radial = vi.fn()
    ctx.createRadialGradient = radial
    drawOgCard(ctx, buildPersonaCardData(report))
    expect(radial).not.toHaveBeenCalled()
  })
})

describe('renderPersonaCardPng', () => {
  it('rejects cleanly where canvas is unavailable (as in jsdom)', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    await expect(renderPersonaCardPng(buildPersonaCardData(report))).rejects.toThrow(/not supported/)
  })
})
