// Vite plugin for search engines and link previews:
//   - fills index.html's <!-- seo:start/end --> block with the landing page's
//     title, description, canonical, Open Graph tags and JSON-LD
//   - after a build, writes a static HTML page per export guide
//     (dist/guide/<browser>/index.html) that reads fine without JavaScript,
//     plus sitemap.xml and robots.txt
// The React app takes over each page when its script loads.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { GUIDES, LANDING, headTags, renderGuideHtml, buildSitemap, buildRobots } from '../src/lib/seo.js'

const SEO_BLOCK = /<!-- seo:start -->[\s\S]*?<!-- seo:end -->/

// Absolute URLs are required in sitemaps and og:image. Vercel sets
// VERCEL_PROJECT_PRODUCTION_URL during its builds; locally we fall back to
// the `vite preview` address.
export function siteBaseUrl(env = {}) {
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : ''
  return String(env.VITE_PUBLIC_URL || vercel || 'http://localhost:4173').trim().replace(/\/+$/, '')
}

export function pageHtml(template, page, base, body = '') {
  let html = template.replace(SEO_BLOCK, `<!-- seo:start -->\n    ${headTags(page, base)}\n    <!-- seo:end -->`)
  if (body) html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`)
  return html
}

export async function writePrerenderedPages(outDir, base, { lastmod = new Date().toISOString().slice(0, 10) } = {}) {
  const template = await readFile(path.join(outDir, 'index.html'), 'utf8')
  for (const guide of GUIDES) {
    const dir = path.join(outDir, 'guide', guide.id)
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, 'index.html'), pageHtml(template, guide, base, renderGuideHtml(guide)))
  }
  await writeFile(path.join(outDir, 'sitemap.xml'), buildSitemap(base, { lastmod }))
  await writeFile(path.join(outDir, 'robots.txt'), buildRobots(base))
}

export default function seoPlugin(base) {
  return [
    { name: 'seo-head', transformIndexHtml: (html) => pageHtml(html, LANDING, base) },
    {
      name: 'seo-prerender',
      apply: 'build',
      async writeBundle(options) {
        await writePrerenderedPages(options.dir, base)
      },
    },
  ]
}
