// The public address of the site, printed on cards and slides so every
// shared image says where to make your own. Set VITE_PUBLIC_URL at build
// time (e.g. https://browsewrapped.app); otherwise the current origin is used.
export function publicSiteUrl(configured = import.meta.env.VITE_PUBLIC_URL, origin = globalThis.location?.origin) {
  const url = String(configured || '').trim().replace(/\/+$/, '')
  return url || origin || ''
}

// "https://www.browsewrapped.app/" → "browsewrapped.app"
export function siteDomain(url = publicSiteUrl()) {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return ''
  }
}
