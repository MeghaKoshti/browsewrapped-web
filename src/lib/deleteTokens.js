// Remembers the one-time delete token the API returns for each upload, so the
// visitor can delete that report later in the same tab session. It lives in
// sessionStorage (gone when the tab closes) as one JSON map:
//   bw.deleteTokens = { "<analysis id>": "<delete token>" }
// Storage can be unavailable (private mode, blocked site data), so every
// access is guarded and failures just mean "no token here".
const KEY = 'bw.deleteTokens'

function readAll() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(tokens) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(tokens))
  } catch {
    // Storage unavailable: the report still works, it just can't be deleted from here.
  }
}

export function saveAnalysisDeleteToken(analysisId, deleteToken) {
  if (analysisId == null || !deleteToken) return
  writeAll({ ...readAll(), [analysisId]: deleteToken })
}

export function loadAnalysisDeleteToken(analysisId) {
  const token = readAll()[analysisId]
  return typeof token === 'string' && token ? token : null
}

export function forgetAnalysisDeleteToken(analysisId) {
  const tokens = readAll()
  delete tokens[analysisId]
  writeAll(tokens)
}
