import { describe, it, expect } from 'vitest'
import {
  GUIDES, LANDING, PRIVACY_FAQ, SITEMAP_PATHS, buildSitemap, buildRobots, headTags, jsonLdScript,
  softwareApplicationLd, faqPageLd, renderGuideHtml, findGuide,
} from './seo'

const BASE = 'https://browsewrapped.app'

describe('export guide pages', () => {
  it('has one page per browser with a unique title, description and H1', () => {
    expect(GUIDES.map((g) => g.path)).toEqual(['/guide/chrome', '/guide/firefox', '/guide/safari', '/guide/edge'])
    for (const key of ['title', 'description', 'h1']) {
      expect(new Set(GUIDES.map((g) => g[key])).size).toBe(GUIDES.length)
    }
    expect(findGuide('firefox').h1).toBe('How to export your Firefox history')
    expect(findGuide('other')).toBeNull()
  })

  it('renders static HTML with the steps, file paths and a CTA to upload', () => {
    const html = renderGuideHtml(findGuide('chrome'))
    expect(html).toContain('<h1>How to export your Chrome history</h1>')
    expect(html).toContain('%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\History')
    expect(html).toContain('about the last 90 days')
    expect(html).toContain('<a class="btn-primary" href="/">Upload my history</a>')
    expect(html).toContain('<a href="/guide/firefox">Firefox</a>')
    expect(html).not.toContain('“Choose file” above')
    expect(html).toContain('on the BrowseWrapped upload page')
  })

  it('escapes text in the static HTML', () => {
    const html = renderGuideHtml(findGuide('firefox'))
    expect(html).toContain('Profiles/&lt;profile&gt;/places.sqlite')
    expect(html).not.toContain('<profile>')
  })
})

describe('sitemap.xml and robots.txt', () => {
  it('lists the landing page, every guide and the public pages with absolute URLs', () => {
    const xml = buildSitemap(`${BASE}/`, { lastmod: '2026-10-31' })
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])
    expect(locs).toEqual(SITEMAP_PATHS.map((p) => `${BASE}${p}`))
    for (const guide of GUIDES) expect(locs).toContain(`${BASE}${guide.path}`)
    expect(locs).not.toContain(`${BASE}/billing/success`)
    expect(xml).toContain('<lastmod>2026-10-31</lastmod>')
  })

  it('keeps reports and billing pages out of search and points to the sitemap', () => {
    const robots = buildRobots(BASE)
    for (const path of ['/r/', '/analyses/', '/billing/', '/auth/']) expect(robots).toContain(`Disallow: ${path}`)
    expect(robots).toContain(`Sitemap: ${BASE}/sitemap.xml`)
  })
})

describe('JSON-LD', () => {
  it('describes the app and the privacy FAQ', () => {
    expect(softwareApplicationLd(BASE)).toMatchObject({ '@type': 'SoftwareApplication', name: 'BrowseWrapped', url: `${BASE}/`, offers: { price: '0' } })
    const faq = faqPageLd()
    expect(faq['@type']).toBe('FAQPage')
    expect(faq.mainEntity).toHaveLength(PRIVACY_FAQ.length)
    expect(faq.mainEntity[0]).toMatchObject({ '@type': 'Question', acceptedAnswer: { '@type': 'Answer' } })
  })

  it('is a non-executed data block that can’t break out of its script tag', () => {
    const tag = jsonLdScript({ text: '</script><script>alert(1)</script>' })
    expect(tag.startsWith('<script type="application/ld+json">')).toBe(true)
    expect(tag.match(/<\/script>/g)).toHaveLength(1)
    expect(JSON.parse(tag.replace(/^<script[^>]*>|<\/script>$/g, ''))).toEqual({ text: '</script><script>alert(1)</script>' })
  })
})

describe('head tags', () => {
  it.each([LANDING, ...GUIDES].map((p) => [p.path, p]))('for %s', (_path, page) => {
    expect(headTags(page, BASE)).toMatchSnapshot()
  })

  it('puts JSON-LD on the landing page only', () => {
    expect(headTags(LANDING, BASE)).toContain('"@type":"FAQPage"')
    expect(headTags(GUIDES[0], BASE)).not.toContain('application/ld+json')
  })
})
