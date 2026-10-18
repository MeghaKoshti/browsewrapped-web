import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { getSharedReport, deleteShareLink } from '../api/client'
import { loadDeleteToken, forgetDeleteToken } from '../lib/shareTokens'
import ReportView from '../components/report/ReportView'
import StatusScreen, { Spinner } from '../components/report/StatusScreen'

// /r/:token — a public, read-only shared report.
export default function SharedReportPage() {
  const { token } = useParams()
  const navigate  = useNavigate()
  const [shared, setShared] = useState(null)
  const [error, setError]   = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteToken] = useState(() => loadDeleteToken(token))

  useEffect(() => {
    const controller = new AbortController()
    getSharedReport(token, { signal: controller.signal })
      .then(setShared)
      .catch((err) => {
        if (axios.isCancel(err)) return
        setError(err.response?.status === 404
          ? 'This shared report doesn’t exist or has expired. Links last 30 days.'
          : 'We couldn’t load this report. Please try again in a moment.')
      })
    return () => controller.abort()
  }, [token])

  const removeLink = async () => {
    if (!deleteToken) return
    setDeleting(true)
    try {
      await deleteShareLink(token, deleteToken)
      forgetDeleteToken(token)
      navigate('/', { replace: true })
    } catch {
      setDeleting(false)
      setError('Could not delete this link. Please try again.')
    }
  }

  if (error) {
    return (
      <StatusScreen>
        <span style={{ fontSize: 40 }} aria-hidden="true">🔗</span>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--text)', margin: 0 }}>{error}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            padding: '10px 24px', borderRadius: 100, border: '1px solid rgba(168,85,247,0.45)',
            background: 'rgba(168,85,247,0.1)', color: 'var(--accent)', fontFamily: 'var(--font-display)',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >
          Make your own Wrapped
        </button>
      </StatusScreen>
    )
  }

  if (!shared) {
    return (
      <StatusScreen>
        <Spinner />
        <p role="status" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
          Loading shared report…
        </p>
      </StatusScreen>
    )
  }

  const banner = (
    <div
      role="note"
      style={{ background: 'rgba(6,182,212,0.08)', borderBottom: '1px solid rgba(6,182,212,0.25)', padding: '10px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text)' }}
    >
      A shared BrowseWrapped report · expires {new Date(shared.expires_at).toLocaleDateString()}
      {deleteToken && (
        <>
          {' · '}
          <button
            type="button"
            onClick={removeLink}
            disabled={deleting}
            style={{ background: 'none', border: 'none', padding: 0, color: '#fca5a5', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}
          >
            {deleting ? 'Deleting…' : 'Delete this link'}
          </button>
        </>
      )}
    </div>
  )

  return <ReportView data={shared.report} banner={banner} shared />
}
