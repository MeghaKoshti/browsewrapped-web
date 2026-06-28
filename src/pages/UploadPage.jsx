import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeHistory, analyzeChrome } from '../api/client'
import UrlStream from '../components/ui/UrlStream'

const MAX_BYTES = 100 * 1024 * 1024

export default function UploadPage() {
  const [dragging, setDragging] = useState(false)
  const [state, setState] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const onSuccess = useCallback((data, filename) => {
    navigate('/results', { state: { data, filename } })
  }, [navigate])

  const onError = useCallback((msg) => {
    setState('error')
    setError(msg)
  }, [])

  const handleFile = useCallback(async (file) => {
    if (!file) return
    if (file.size > MAX_BYTES) return onError('File too large (max 100 MB)')
    setState('loading')
    setProgress(0)
    setLoadingMsg('Uploading…')
    try {
      const data = await analyzeHistory(file, (p) => {
        setProgress(p)
        if (p === 100) setLoadingMsg('Analyzing patterns…')
      })
      onSuccess(data, file.name)
    } catch (err) {
      onError(err.response?.data?.error || err.message || 'Something went wrong')
    }
  }, [onSuccess, onError])

  const handleChrome = useCallback(async () => {
    setState('loading')
    setProgress(0)
    setLoadingMsg('Reading Chrome history…')
    try {
      const data = await analyzeChrome()
      onSuccess(data, 'Chrome History')
    } catch (err) {
      onError(err.response?.data?.error || err.message || 'Could not read Chrome history')
    }
  }, [onSuccess, onError])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const isLoading = state === 'loading'

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16"
         style={{ background: 'var(--void)' }}>
      <UrlStream />

      {/* Content */}
      <div className="relative z-10 w-full max-w-xl">

        {/* Brand wordmark */}
        <p className="mono text-center mb-12" style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--muted)', textTransform: 'uppercase' }}>
          BrowseWrapped
        </p>

        {/* Hero headline */}
        <div className="text-center mb-10">
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em' }}>
            <span style={{ display: 'block', fontSize: 'clamp(1.8rem, 6vw, 3rem)', color: 'var(--muted)', fontWeight: 300 }}>
              Your tabs,
            </span>
            <span className="gradient-text" style={{ display: 'block', fontSize: 'clamp(3.5rem, 12vw, 6rem)', fontWeight: 700 }}>
              examined.
            </span>
          </h1>
          <p style={{ marginTop: '1.25rem', fontSize: '1rem', color: 'var(--muted)', letterSpacing: '0.01em' }}>
            Every click. Every rabbit hole. Finally visualized.
          </p>
        </div>

        {isLoading ? (
          /* Loading */
          <div className="card p-10 flex flex-col items-center gap-5 text-center">
            <div className="relative" style={{ width: 72, height: 72 }}>
              <svg style={{ width: 72, height: 72, transform: 'rotate(-90deg)' }} viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(168,85,247,0.12)" strokeWidth="4" />
                <circle
                  cx="36" cy="36" r="30" fill="none"
                  stroke="url(#loadGrad)" strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={progress > 0
                    ? `${2 * Math.PI * 30 * (1 - progress / 100)}`
                    : `${2 * Math.PI * 30 * 0.72}`}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 0.4s ease',
                    animation: progress === 0 ? 'rotate 1.2s linear infinite' : 'none',
                    transformOrigin: 'center',
                  }}
                />
                <defs>
                  <linearGradient id="loadGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#f472b6" />
                  </linearGradient>
                </defs>
              </svg>
              {progress > 0 && (
                <span className="mono absolute inset-0 flex items-center justify-center"
                      style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent)' }}>
                  {progress}%
                </span>
              )}
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text)' }}>
                {loadingMsg}
              </p>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                Crunching your browsing patterns…
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Chrome primary CTA ── */}
            <button
              type="button"
              onClick={handleChrome}
              className="chrome-btn w-full text-left"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '20px 24px',
                borderRadius: 18,
                border: '1px solid rgba(168,85,247,0.4)',
                background: 'var(--surface)',
                cursor: 'pointer',
                color: 'var(--text)',
              }}
            >
              <span style={{ fontSize: 32, flexShrink: 0, lineHeight: 1 }}>🌐</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'white', lineHeight: 1.2, margin: 0 }}>
                  Import from Chrome
                </p>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                  Reads your local Chrome database — instant, no export needed
                </p>
              </div>
              <span style={{ color: 'var(--accent)', fontSize: 22, flexShrink: 0, fontWeight: 300 }}>→</span>
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em' }}>
                or upload a file
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* File drop zone */}
            <div
              className={`drop-zone ${dragging ? 'dragging' : ''}`}
              style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onClick={() => inputRef.current?.click()}
            >
              <span style={{ fontSize: 26 }}>📂</span>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                  {dragging ? 'Drop it here' : 'Drop your export file'}
                </p>
                <p className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, letterSpacing: '0.06em' }}>
                  JSON · CSV
                </p>
              </div>
              <button
                type="button"
                style={{
                  marginTop: 4,
                  padding: '8px 20px',
                  borderRadius: 100,
                  border: '1px solid rgba(168,85,247,0.45)',
                  background: 'rgba(168,85,247,0.1)',
                  color: 'var(--accent)',
                  fontSize: 13,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
              >
                Choose File
              </button>
              <input
                ref={inputRef} type="file" accept=".json,.csv" className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>

            {/* Format hints */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              {[
                { title: 'Chrome Takeout', body: 'takeout.google.com → Chrome → export BrowserHistory.json' },
                { title: 'Firefox / other', body: 'Install an "Export Browsing History" add-on for a CSV or JSON file' },
              ].map((h) => (
                <div key={h.title} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <p style={{ fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>{h.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>{h.body}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Error */}
        {state === 'error' && (
          <div style={{
            marginTop: 14, padding: '12px 16px', borderRadius: 12, textAlign: 'center',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <p style={{ fontSize: 13, color: '#fca5a5', margin: 0 }}>{error}</p>
            <button
              style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setState('idle')}
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rotate { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
