// Turns an API error into text we can show. Handles both error body shapes:
//   new: { error: { code, message }, error_message: "..." }
//   old: { error: "..." }
// A few statuses get friendlier copy than the raw server message.

const FRIENDLY = {
  payload_too_large: 'That file is too big. The limit is 100 MB. Try exporting a shorter date range.',
  unsupported_media_type: 'That file type isn’t supported. Upload a JSON or CSV export of your history.',
}

const CODE_FOR_STATUS = { 413: 'payload_too_large', 415: 'unsupported_media_type', 429: 'rate_limited' }

const DEFAULT_RETRY_SECONDS = 60

// Retry-After is either a number of seconds ("120") or an HTTP date
// ("Wed, 21 Oct 2026 07:28:00 GMT"). Anything missing or unreadable means
// "about a minute", the API's throttle window.
export function retryAfterSeconds(header, now = Date.now()) {
  const value = String(header ?? '').trim()
  if (/^\d+$/.test(value)) {
    const seconds = Number(value)
    return seconds > 0 ? seconds : DEFAULT_RETRY_SECONDS
  }
  const date = Date.parse(value)
  if (Number.isNaN(date)) return DEFAULT_RETRY_SECONDS
  const seconds = Math.ceil((date - now) / 1000)
  return seconds > 0 ? seconds : DEFAULT_RETRY_SECONDS
}

const plural = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`

// 45 -> "45 seconds", 300 -> "5 minutes", 7200 -> "2 hours"
export function formatWait(seconds) {
  if (seconds <= 90) return plural(seconds, 'second')
  if (seconds < 90 * 60) return plural(Math.ceil(seconds / 60), 'minute')
  return plural(Math.ceil(seconds / 3600), 'hour')
}

function rateLimitedMessage(headers) {
  // Axios lower-cases header names; plain objects in tests may not.
  const header = headers?.['retry-after'] ?? headers?.['Retry-After']
  return `Too many requests right now. Please wait ${formatWait(retryAfterSeconds(header))} and try again.`
}

export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const response = err?.response
  const data = response?.data
  const code = (typeof data?.error === 'object' && data.error?.code) || CODE_FOR_STATUS[response?.status]

  if (code === 'rate_limited') return rateLimitedMessage(response?.headers)
  if (FRIENDLY[code]) return FRIENDLY[code]

  const message = data?.error?.message ?? data?.error_message ?? (typeof data?.error === 'string' ? data.error : null)
  return typeof message === 'string' && message.trim() ? message : fallback
}
