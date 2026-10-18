// Remembers the one-time delete token for links created in this browser, so
// the owner can delete them later. Storage can be unavailable (private mode,
// blocked site data), so every access is guarded.
const key = (token) => `browsewrapped:share:${token}`

export function saveDeleteToken(token, deleteToken) {
  try {
    localStorage.setItem(key(token), deleteToken)
  } catch {
    // Storage unavailable: the link still works, it just can't be deleted from here later.
  }
}

export function loadDeleteToken(token) {
  try {
    return localStorage.getItem(key(token))
  } catch {
    return null
  }
}

export function forgetDeleteToken(token) {
  try {
    localStorage.removeItem(key(token))
  } catch {
    // ignore
  }
}
