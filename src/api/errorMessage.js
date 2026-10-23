// Turns an API error into text we can show. Handles both error body shapes:
//   new: { error: { code, message }, error_message: "..." }
//   old: { error: "..." }
// A few statuses get friendlier copy than the raw server message.

const FRIENDLY = {
  payload_too_large: 'That file is too big. The limit is 100 MB. Try exporting a shorter date range.',
  unsupported_media_type: 'That file type isn’t supported. Upload a JSON or CSV export of your history.',
}

const CODE_FOR_STATUS = { 413: 'payload_too_large', 415: 'unsupported_media_type', 429: 'rate_limited' }

function rateLimitedMessage(retryAfter) {
  const seconds = Number.parseInt(retryAfter, 10)
  const wait = seconds > 0 && seconds <= 120 ? `${seconds} seconds` : 'a minute'
  return `Too many requests right now. Please wait ${wait} and try again.`
}

export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const response = err?.response
  const data = response?.data
  const code = (typeof data?.error === 'object' && data.error?.code) || CODE_FOR_STATUS[response?.status]

  if (code === 'rate_limited') return rateLimitedMessage(response?.headers?.['retry-after'])
  if (FRIENDLY[code]) return FRIENDLY[code]

  const message = data?.error?.message ?? data?.error_message ?? (typeof data?.error === 'string' ? data.error : null)
  return typeof message === 'string' && message.trim() ? message : fallback
}
