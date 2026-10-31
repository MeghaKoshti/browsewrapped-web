import { Link } from 'react-router-dom'

// Full-page wrapper for the "processing" and "failed" states of an analysis.
export default function StatusScreen({ children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16" style={{ background: 'var(--void)' }}>
      <Link
        to="/"
        className="mono"
        style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--muted)', textTransform: 'uppercase', textDecoration: 'none', marginBottom: 32 }}
      >
        BrowseWrapped
      </Link>
      <main id="main" tabIndex={-1} className="card p-10 w-full max-w-md flex flex-col items-center gap-5 text-center" style={{ outline: 'none' }}>
        {children}
      </main>
    </div>
  )
}

export function Spinner() {
  return (
    <svg className="status-spinner" style={{ width: 72, height: 72 }} viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(168,85,247,0.12)" strokeWidth="4" />
      <circle
        cx="36" cy="36" r="30" fill="none" stroke="url(#statusGrad)" strokeWidth="4"
        strokeDasharray={`${2 * Math.PI * 30}`} strokeDashoffset={`${2 * Math.PI * 30 * 0.72}`} strokeLinecap="round"
      />
      <defs>
        <linearGradient id="statusGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
    </svg>
  )
}
