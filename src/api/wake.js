// The API runs on Render's free plan, which puts it to sleep after 15 minutes
// without visits. The first request after that fails (a 502/503/504 page from
// Render's proxy, which the browser reports as a network error because it has
// no CORS headers) until the server is back up, usually within a minute.
//
// withWakeRetry retries such requests for a while and tells the caller once,
// so the page can say "waking up" instead of showing an error.

export const WAKING_MESSAGE = 'Waking up the server… the first visit can take up to a minute.'

// True when the request never reached the app: no response at all, or a
// gateway error without the API's own JSON error body.
export function isColdStartError(err) {
  if (!err || err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return false
  const response = err.response
  if (!response) return true
  return [502, 503, 504].includes(response.status) && !response.data?.error
}

const DEFAULT_DELAYS_MS = [2000, 3000, 5000, 8000, 10000, 10000, 10000, 10000, 10000]

export async function withWakeRetry(request, {
  onWaking,
  delaysMs = DEFAULT_DELAYS_MS,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  let warned = false
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await request()
    } catch (err) {
      if (!isColdStartError(err) || attempt >= delaysMs.length) throw err
      if (!warned) {
        warned = true
        onWaking?.()
      }
      await sleep(delaysMs[attempt])
    }
  }
}
