// Facts the legal pages depend on, in one place. The name, email and city
// come from build-time env vars so the real values never need to be in git;
// the bracketed defaults make a missing value obvious on the page.
// These pages are a starting point, not legal advice: see README → Legal pages.

// Change this whenever any legal page changes.
export const LEGAL_LAST_UPDATED = '2026-10-31'

export const OPERATOR_NAME = import.meta.env.VITE_LEGAL_NAME || '[Operator name]'
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'contact@example.com'
export const JURISDICTION_CITY = import.meta.env.VITE_LEGAL_CITY || '[City]'

export const REFUND_WINDOW_DAYS = 7
export const REPORT_RETENTION_DAYS = 7
export const SHARE_LINK_DAYS = 30
export const MIN_AGE = 18

// "2026-10-24" → "24 October 2026", read as UTC so it never shifts a day.
export function formatLegalDate(iso = LEGAL_LAST_UPDATED) {
  const date = new Date(`${iso}T00:00:00Z`)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}
