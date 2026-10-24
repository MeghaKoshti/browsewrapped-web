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
export async function createShareLink({ analysisId, report }) {
  const body = analysisId ? { analysis_id: analysisId } : { report }
  const { data } = await http.post('/v1/shared_reports', body)
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
