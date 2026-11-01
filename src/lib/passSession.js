// The signed Pass session token from POST /sessions/verify, kept on this
// device for up to 30 days. Storage can be unavailable, so every access is
// guarded: without storage the Pass simply isn't remembered.
const KEY = 'bw.passToken'

export function loadPassToken() {
  try {
    return localStorage.getItem(KEY) || null
  } catch {
    return null
  }
}

export function savePassToken(token) {
  try {
    localStorage.setItem(KEY, token)
  } catch {
    // ignore: the Pass works for this page view only
  }
}

export function clearPassToken() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
