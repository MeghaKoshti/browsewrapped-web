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

export async function analyzeChrome() {
  const { data } = await http.get('/api/v1/chrome')
  return data
}
