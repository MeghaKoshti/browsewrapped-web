import axios from 'axios'

const http = axios.create({ baseURL: '/' })

export async function analyzeHistory(file, onProgress) {
  const form = new FormData()
  form.append('file', file)

  const { data } = await http.post('/api/v1/analyze', form, {
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

  const { data } = await http.post('/api/v1/analyses', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })

  return data
}

export async function getAnalysis(id, { signal } = {}) {
  const { data } = await http.get(`/api/v1/analyses/${id}`, { signal })
  return data
}

export async function fetchSampleReport() {
  const { data } = await http.get('/api/v1/sample')
  return data
}

export async function analyzeChrome() {
  const { data } = await http.get('/api/v1/chrome')
  return data
}
