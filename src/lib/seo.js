// Everything search engines see, in one plain-JS module so both the React
// pages and the build-time prerender (scripts/seoPlugin.js) use it:
// page titles and descriptions, the export guides, the landing FAQ, JSON-LD,
// the sitemap and robots.txt. No JSX and no import.meta.env here: the build
// plugin runs in Node.
import { BROWSERS, OS_LABELS, OPEN_FOLDER_HINTS, SQLITE_TIP, orderedPaths } from './exportGuide.js'

export const SITE_NAME = 'BrowseWrapped'

export const LANDING = {
  path: '/',
  title: 'BrowseWrapped — Your Year in Tabs',
  description: 'Turn your browser history into a Spotify Wrapped-style report: your persona, top topics, browsing rhythm and more. Free, no sign-up.',
}

// The 3-step "How it works" on the landing page. It really is a sequence.
export const HOW_IT_WORKS = [
  { title: 'Export your history', body: 'Find your browser’s history file with our step-by-step guides. It takes about a minute.' },
  { title: 'Upload it', body: 'Your file is analysed on our server and deleted as soon as it has been read.' },
  { title: 'Get your Wrapped', body: 'See your persona, top topics and browsing rhythm, then share a card or story slides.' },
]

// Privacy FAQ: shown on the landing page and sent as FAQPage JSON-LD.
// Keep in step with the Privacy Policy and UploadPrivacy.
export const PRIVACY_FAQ = [
  {
    q: 'What do you keep from my history file?',
    a: 'The file itself is deleted as soon as it has been analysed. The finished report (totals, topics, top sites, top pages and top searches) is kept for 7 days so you can reopen it, then deleted. You can delete it sooner with “Delete this report now”.',
  },
  {
    q: 'Do you sell or share my browsing data?',
    a: 'No. We don’t sell data, show ads or build profiles. Share links you create contain totals and topics only, never addresses, page titles, searches or site names, and expire after 30 days.',
  },
  {
    q: 'Is my history sent to an AI?',
    a: 'Only up to 50 site names our rules don’t recognise (like example.com) may be sent to Google Gemini to pick a topic. Never full addresses, page titles, searches or your IP address.',
  },
  {
    q: 'Do I need an account?',
    a: 'No. The full report is free with no sign-up. If you buy the optional Wrapped Pass, it is linked to your email only.',
  },
  {
    q: 'Can I try it without uploading anything?',
    a: 'Yes. “Try with sample data” shows a full report made from a made-up history.',
  },
  {
    q: 'Which browsers work?',
    a: 'Chrome, Edge, Firefox and Safari, plus Brave, Vivaldi and Opera (they keep a Chrome-style History file), or any CSV or JSON export.',
  },
]

// Search-intent copy for each browser guide, matched to how people search.
const GUIDE_COPY = {
  chrome: {
    title: 'How to export your Chrome history',
    description: 'Where Chrome keeps its History file on Mac, Windows and Linux, how to export it with Google Takeout, and how to turn it into your own Wrapped.',
    intro: 'Chrome keeps your history in a file called History in your profile folder. Copy it, upload the copy, and see your year in tabs.',
  },
  firefox: {
    title: 'How to export your Firefox history',
    description: 'Find Firefox’s places.sqlite history file on Mac, Windows or Linux in under a minute, then turn it into your own browsing Wrapped.',
    intro: 'Firefox keeps your history in places.sqlite inside your profile folder. Copy it, upload the copy, and see what you explored.',
  },
  safari: {
    title: 'How to export your Safari history',
    description: 'Find Safari’s History.db file on your Mac, copy it and turn your browsing history into a Spotify Wrapped-style report.',
    intro: 'Safari keeps your history in History.db in your Library folder. Copy it, upload the copy, and see your year in tabs.',
  },
  edge: {
    title: 'How to export your Microsoft Edge history',
    description: 'Where Edge keeps its History file on Windows, Mac and Linux, and how to turn it into your own browsing Wrapped.',
    intro: 'Microsoft Edge keeps your history in a file called History in your profile folder, just like Chrome. Copy it, upload the copy, and see your year in tabs.',
  },
}

// The upload page's steps say “Choose file” above; on a guide page the upload is elsewhere.
const guideStep = (step) => step.replace(/with “Choose file” above|“Choose file” above/, 'on the BrowseWrapped upload page')

export const GUIDES = BROWSERS.filter((b) => GUIDE_COPY[b.id]).map((browser) => ({
  id: browser.id,
  label: browser.label,
  path: `/guide/${browser.id}`,
  h1: GUIDE_COPY[browser.id].title,
  title: `${GUIDE_COPY[browser.id].title} — ${SITE_NAME}`,
  description: GUIDE_COPY[browser.id].description,
  intro: GUIDE_COPY[browser.id].intro,
  methods: browser.methods.map((m) => ({
    ...m,
    steps: m.steps.map(guideStep),
    paths: orderedPaths(m.paths).map(({ os, path }) => ({ os, label: OS_LABELS[os], path, hint: OPEN_FOLDER_HINTS[os] })),
  })),
}))

export const FOOTER_LINKS = [
  { to: '/pricing', label: 'Pricing' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/refund', label: 'Refunds' },
  { to: '/contact', label: 'Contact' },
]

export const findGuide = (id) => GUIDES.find((g) => g.id === id) || null

// Public pages worth indexing. Reports, shares and billing pages are not.
export const SITEMAP_PATHS = ['/', ...GUIDES.map((g) => g.path), '/pricing', '/privacy', '/terms', '/refund', '/contact']
export const DISALLOWED_PATHS = ['/r/', '/analyses/', '/results', '/billing/', '/auth/']

export const absoluteUrl = (base, path) => `${String(base).replace(/\/+$/, '')}${path}`

export function buildSitemap(base, { lastmod } = {}) {
  const urls = SITEMAP_PATHS.map((path) => [
    '  <url>',
    `    <loc>${escapeHtml(absoluteUrl(base, path))}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    '  </url>',
  ].filter(Boolean).join('\n'))
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

export function buildRobots(base) {
  return ['User-agent: *', 'Allow: /', ...DISALLOWED_PATHS.map((p) => `Disallow: ${p}`), '', `Sitemap: ${absoluteUrl(base, '/sitemap.xml')}`, ''].join('\n')
}

// ── JSON-LD ─────────────────────────────────────────────────────────────────
export function softwareApplicationLd(base) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    url: absoluteUrl(base, '/'),
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web browser',
    description: LANDING.description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }
}

export function faqPageLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PRIVACY_FAQ.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }
}

// A non-executed data block, so the strict CSP (script-src 'self') allows
// it. "<" is escaped so the JSON can never close the script element.
export function jsonLdScript(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
}

// ── HTML ────────────────────────────────────────────────────────────────────
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// <title>, description, canonical, Open Graph and Twitter tags (+ JSON-LD on the landing page).
export function headTags(page, base) {
  const url = absoluteUrl(base, page.path)
  const image = absoluteUrl(base, '/og-image.png')
  const tags = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${SITE_NAME}: your year in tabs" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ]
  // index.html is also the fallback for every client-side route (/pricing,
  // /privacy…), so it must not claim a canonical URL; only static pages do.
  if (page.path === '/') tags.push(jsonLdScript(softwareApplicationLd(base)), jsonLdScript(faqPageLd()))
  else tags.splice(2, 0, `<link rel="canonical" href="${escapeHtml(url)}" />`, `<meta property="og:url" content="${escapeHtml(url)}" />`)
  return tags.join('\n    ')
}

// The guide as static HTML for the prerendered /guide/:id pages. It uses the
// same classes as the React GuidePage, so the swap when JS loads is seamless.
export function renderGuideHtml(guide) {
  const e = escapeHtml
  const method = (m) => [
    `<h2>${e(m.title)}</h2>`,
    `<ol>${m.steps.map((s) => `<li>${e(s)}</li>`).join('')}</ol>`,
    m.file ? `<p class="doc-tip">${e(SQLITE_TIP)}</p>` : '',
    m.paths.length
      ? `<ul class="guide-paths">${m.paths.map((p) => `<li><strong>${e(p.label)}</strong><code>${e(p.path)}</code><span>${e(p.hint)}</span></li>`).join('')}</ul>`
      : '',
    m.link ? `<p><a href="${e(m.link.href)}" rel="noopener noreferrer">${e(m.link.text)}</a></p>` : '',
    m.note ? `<p>${e(m.note)}</p>` : '',
  ].join('')
  const others = GUIDES.filter((g) => g.id !== guide.id)
  return [
    '<div class="doc-page">',
    '<header class="doc-header"><a href="/" class="doc-wordmark">BrowseWrapped</a></header>',
    '<main id="main" tabindex="-1" class="doc guide">',
    `<h1>${e(guide.h1)}</h1>`,
    `<p class="doc-intro">${e(guide.intro)}</p>`,
    guide.methods.map(method).join(''),
    '<section class="guide-cta" aria-labelledby="guide-cta-title">',
    '<h2 id="guide-cta-title">Got the file? Make your Wrapped</h2>',
    '<p>Upload it on the home page. The file is deleted as soon as it has been analysed, and your report is free.</p>',
    '<a class="btn-primary" href="/">Upload my history</a>',
    '</section>',
    `<p class="guide-others">Other browsers: ${others.map((g) => `<a href="${g.path}">${e(g.label)}</a>`).join(', ')}.</p>`,
    '</main>',
    '</div>',
    // The same links as the React SiteFooter.
    `<footer class="site-footer"><nav aria-label="Footer"><ul>${FOOTER_LINKS.map((l) => `<li><a href="${l.to}">${l.label}</a></li>`).join('')}</ul></nav><p>© ${new Date().getFullYear()} BrowseWrapped. Your history stays yours.</p></footer>`,
  ].join('\n')
}
