// Pure helpers for the pricing page: which currency to show, the price to
// charge right now, and how to write it.

export const CURRENCIES = ['INR', 'USD']

// ₹ for visitors in India (an en-IN style locale or an Indian timezone), $ for
// everyone else. They can switch by hand on the page.
export function detectCurrency({ languages = [], timeZone = '' } = {}) {
  const inIndia = languages.some((l) => /-IN$/i.test(String(l))) || ['Asia/Kolkata', 'Asia/Calcutta'].includes(timeZone)
  return inIndia ? 'INR' : 'USD'
}

export function browserCurrency() {
  let timeZone = ''
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {
    // very old browsers: fall back to the language check
  }
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
  return detectCurrency({ languages, timeZone })
}

// The early-bird price applies until `early_bird_until` (exclusive).
export function isEarlyBird(pricing, now = Date.now()) {
  const until = Date.parse(pricing?.early_bird_until ?? '')
  return !Number.isNaN(until) && now < until
}

// { amount, regular, earlyBird } in minor units (paise / cents), or null.
export function priceFor(pricing, currency, now = Date.now()) {
  const price = pricing?.prices?.[currency]
  if (!price) return null
  const earlyBird = isEarlyBird(pricing, now) && price.early_bird_amount > 0 && price.early_bird_amount < price.amount
  return { amount: earlyBird ? price.early_bird_amount : price.amount, regular: price.amount, earlyBird }
}

// 19900, 'INR' → "₹199"; 250, 'USD' → "$2.50". Whole amounts drop the decimals.
export function formatPrice(minor, currency) {
  const major = minor / 100
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major)
}

// "2026-12-15T23:59:59Z" → "15 December 2026" (UTC, so it matches the server).
export function formatDate(iso, locale = 'en-GB') {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

// Free vs Wrapped Pass, as on the pricing page. `soon` marks Pass features
// that are planned but not built yet, so nobody pays for something missing.
export const PLAN_FEATURES = [
  { feature: 'Full report with every chart (Chrome, Firefox, Safari, Edge, JSON or CSV)', free: true, pass: true },
  { feature: 'Persona card image', free: 'With the site address', pass: 'With the site address' },
  { feature: 'Story slides for Instagram, WhatsApp and LinkedIn (1080×1920)', free: 'First slide', pass: 'All 5 slides' },
  { feature: 'Delete your report any time', free: true, pass: true },
  { feature: 'Then vs now: last 30 days against the 30 before', free: true, pass: true },
  { feature: 'Share links', free: 'Expire after 30 days', pass: 'Never expire, pick which sections show', soon: true },
  { feature: 'Report storage', free: '7 days', pass: '12 months, open from any device by email', soon: true },
  { feature: 'Merge several history files (work and personal laptop)', free: false, pass: true, soon: true },
  { feature: 'Compare any two saved reports (2025 vs 2026)', free: false, pass: true, soon: true },
  { feature: 'Fix categories and add your own topics', free: false, pass: true, soon: true },
  { feature: 'Private PDF export', free: false, pass: true, soon: true },
]

// Only follow http(s) links from the API, never javascript: or data: URLs.
export function isSafeRedirect(url) {
  try {
    return ['https:', 'http:'].includes(new URL(url, window.location.href).protocol)
  } catch {
    return false
  }
}
