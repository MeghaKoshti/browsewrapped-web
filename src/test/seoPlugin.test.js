import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { writePrerenderedPages, pageHtml, siteBaseUrl, guideHtmlPath } from '../../scripts/seoPlugin.js'
import { GUIDES, LANDING } from '../lib/seo'

const TEMPLATE = `<!doctype html><html><head>
    <!-- seo:start --><title>x</title><!-- seo:end -->
    <script type="module" crossorigin src="/assets/index-abc.js"></script>
  </head><body><div id="root"></div></body></html>`

describe('seo build plugin', () => {
  let dir
  afterEach(async () => { if (dir) await rm(dir, { recursive: true, force: true }) })

  it('picks an absolute site URL', () => {
    expect(siteBaseUrl({ VITE_PUBLIC_URL: 'https://browsewrapped.app/' })).toBe('https://browsewrapped.app')
    expect(siteBaseUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'bw.vercel.app' })).toBe('https://bw.vercel.app')
    expect(siteBaseUrl({})).toBe('http://localhost:4173')
  })

  it('fills the landing page head', () => {
    const html = pageHtml(TEMPLATE, LANDING, 'https://browsewrapped.app')
    expect(html).toContain('<title>BrowseWrapped — Your Year in Tabs</title>')
    // index.html also serves other client-side routes, so no canonical here.
    expect(html).not.toContain('rel="canonical"')
    expect(html).toContain('"@type":"FAQPage"')
    expect(html).toContain('<div id="root"></div>')
  })

  it('writes an HTML page per guide, readable without JavaScript, plus sitemap and robots', async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'bw-seo-'))
    await writeFile(path.join(dir, 'index.html'), TEMPLATE)
    await writePrerenderedPages(dir, 'https://browsewrapped.app', { lastmod: '2026-10-31' })

    for (const guide of GUIDES) {
      const html = await readFile(path.join(dir, 'guide', guide.id, 'index.html'), 'utf8')
      expect(html).toContain(`<title>${guide.title}</title>`)
      expect(html).toContain(`<link rel="canonical" href="https://browsewrapped.app${guide.path}" />`)
      expect(html).toMatch(new RegExp(`<div id="root">[\\s\\S]*<h1>${guide.h1}</h1>`))
      // The app still loads and takes over.
      expect(html).toContain('src="/assets/index-abc.js"')
    }
    expect(await readFile(path.join(dir, 'sitemap.xml'), 'utf8')).toContain('<loc>https://browsewrapped.app/guide/safari</loc>')
    expect(await readFile(path.join(dir, 'robots.txt'), 'utf8')).toContain('Sitemap: https://browsewrapped.app/sitemap.xml')
  })
  it('ships the static 1200×630 fallback preview image under 300 KB', async () => {
    const png = await readFile(path.resolve(process.cwd(), 'public/og-image.png'))
    expect(png.subarray(1, 4).toString()).toBe('PNG')
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
    expect(png.length).toBeLessThan(300 * 1024)
  })
})

describe('guideHtmlPath (vite preview)', () => {
  it('maps known guide URLs to their prerendered HTML, like the Vercel rewrite', () => {
    expect(guideHtmlPath('/guide/chrome')).toBe('/guide/chrome/index.html')
    expect(guideHtmlPath('/guide/edge/?ref=share')).toBe('/guide/edge/index.html')
    expect(guideHtmlPath('/guide/opera')).toBeNull()
    expect(guideHtmlPath('/pricing')).toBeNull()
  })
})
