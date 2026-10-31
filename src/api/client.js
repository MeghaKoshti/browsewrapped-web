import axios from 'axios'

// Where the Rails API lives. In development Vite proxies /api to
// localhost:3000; in production set VITE_API_URL at build time. Both
// "https://api.example.com" and "https://api.example.com/api" work, since
// every API route sits under /api.
export function apiBaseUrl(url) {
  const base = String(url || '').trim().replace(/\/+$/, '')
  if (!base) return '/api'
  return base.endsWith('/api') ? base : `${base}/api`
}

const http = axios.create({ baseURL: apiBaseUrl(import.meta.env.VITE_API_URL) })

// "Import from Chrome" makes the API read Chrome's database on the machine the
// API runs on. That is only the visitor's own Chrome when the API is local
// (the dev proxy or localhost), never on a hosted API such as Fly.io.
export function isLocalApi(url) {
  const base = String(url || '').trim()
  if (!base) return true
  try {
    return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname)
  } catch {
    return false
  }
}

export const canImportLocalChrome = isLocalApi(import.meta.env.VITE_API_URL)

export async function analyzeHistory(file, onProgress) {
  const form = new FormData()
  form.append('file', file)

  const { data } = await http.post('/v1/analyze', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })

  return data
}

// Uploads a file for analysis. Small files come back completed (201, with
// result); large ones come back pending (202) and must be polled.
export async function createAnalysis(file, onProgress) {
  const form = new FormData()
  form.append('file', file)

  const { data } = await http.post('/v1/analyses', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })

  return data
}

export async function getAnalysis(id, { signal } = {}) {
  const { data } = await http.get(`/v1/analyses/${id}`, { signal })
  return data
}

// Deletes a stored analysis right away. The delete token came back once,
// with the upload response, and proves this browser made the upload.
export async function deleteAnalysis(id, deleteToken) {
  await http.delete(`/v1/analyses/${id}`, { headers: { 'X-Delete-Token': deleteToken } })
}

// Creates a public share link. Pass analysisId for stored analyses, or the
// report itself (sample data, Chrome import). The API strips private fields.
// `card` is an optional 1200×630 PNG for link previews; with it the request
// is multipart and the report travels as a JSON string field.
// Returns { token, path, preview_url, delete_token, expires_at }.
export async function createShareLink({ analysisId, report, card }) {
  if (!card) {
    const body = analysisId ? { analysis_id: analysisId } : { report }
    const { data } = await http.post('/v1/shared_reports', body)
    return data
  }
  const form = new FormData()
  if (analysisId) form.append('analysis_id', analysisId)
  else form.append('report', JSON.stringify(report))
  form.append('card', card, 'card.png')
  const { data } = await http.post('/v1/shared_reports', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  return data
}

export async function getSharedReport(token, { signal } = {}) {
  const { data } = await http.get(`/v1/shared_reports/${token}`, { signal })
  return data
}

export async function deleteShareLink(token, deleteToken) {
  await http.delete(`/v1/shared_reports/${token}`, { headers: { 'X-Delete-Token': deleteToken } })
}

export async function fetchSampleReport() {
  const { data } = await http.get('/v1/sample')
  return data
}

export async function analyzeChrome() {
  const { data } = await http.get('/v1/chrome')
  return data
}

// ── Wrapped Pass ─────────────────────────────────────────────────────────

// Bearer header for endpoints that need a signed-in Pass holder.
export const authHeaders = (accessToken) => (accessToken ? { Authorization: `Bearer ${accessToken}` } : {})

// { plan, prices: { INR: { amount, early_bird_amount }, USD: … }, early_bird_until, valid_days }
// Amounts are in paise / cents.
export async function getPricing({ signal } = {}) {
  const { data } = await http.get('/v1/pricing', { signal })
  return data
}

// Starts a hosted checkout and returns { checkout_url }. The server picks the
// price; the client only says which currency.
export async function createCheckout({ email, currency }) {
  const { data } = await http.post('/v1/checkouts', { email, currency, plan: 'wrapped_pass' })
  return data
}

// Always answers 202, whether or not the email has a Pass.
export async function requestMagicLink(email) {
  await http.post('/v1/sessions/magic_link', { email })
}

// Swaps a single-use email link token for { access_token, email, pass_valid_until }.
// POST, so the token never lands in server logs.
export async function verifyMagicLink(token) {
  const { data } = await http.post('/v1/sessions/verify', { token })
  return data
}

// { email, pass_valid_until, has_pass }; 401 when the token is missing or expired.
export async function getMe(accessToken, { signal } = {}) {
  const { data } = await http.get('/v1/me', { headers: authHeaders(accessToken), signal })
  return data
}
