import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { getAnalysis } from '../api/client'
import ReportView from '../components/report/ReportView'
import ShareButton from '../components/report/ShareButton'
import StatusScreen, { Spinner } from '../components/report/StatusScreen'
import DeleteReportButton from '../components/report/DeleteReportButton'
import { loadAnalysisDeleteToken } from '../lib/deleteTokens'
import useDocumentTitle from '../hooks/useDocumentTitle'

const POLL_INTERVAL_MS = 2000
const MAX_NETWORK_RETRIES = 5

const STATUS_COPY = {
  pending:    { title: 'Queued…',                   body: 'Your file is uploaded and waiting for a worker.' },
  processing: { title: 'Analyzing your history…',   body: 'Classifying every visit and building your Wrapped.' },
}

// /analyses/:id — shows a processing screen and polls the API every 2 s until
// the analysis completes or fails. Refreshing the page resumes polling.
export default function AnalysisPage() {
  const { id }    = useParams()
  const { state } = useLocation()
  const navigate  = useNavigate()

  // When the upload finished synchronously, the result arrives in router state.
  const initialResult = state?.data || null
  const [analysis, setAnalysis] = useState(
    initialResult ? { id, status: 'completed', result: initialResult } : { id, status: 'pending' },
  )
  const [loadError, setLoadError] = useState('')
  // Only the browser tab that uploaded the file holds its delete token.
  const [deleteToken] = useState(() => loadAnalysisDeleteToken(id))

  useEffect(() => {
    if (initialResult) return undefined

    const controller = new AbortController()
    let timer = null
    let failures = 0

    const poll = async () => {
      try {
        const data = await getAnalysis(id, { signal: controller.signal })
        failures = 0
        setAnalysis(data)
        if (data.status === 'pending' || data.status === 'processing') {
          timer = setTimeout(poll, POLL_INTERVAL_MS)
        }
      } catch (err) {
        if (axios.isCancel(err)) return
        if (err.response?.status === 404) {
          setLoadError('We couldn’t find this analysis. Reports are kept for 7 days, so it may have expired.')
          return
        }
        failures += 1
        if (failures >= MAX_NETWORK_RETRIES) {
          setLoadError('We lost contact with the server. Check your connection and refresh the page.')
          return
        }
        timer = setTimeout(poll, POLL_INTERVAL_MS)
      }
    }

    poll()

    // Stop polling when the user leaves the page.
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [id, initialResult])

  const filename = state?.filename || analysis.filename
  const completed = analysis.status === 'completed' && analysis.result
  const failed = analysis.status === 'failed' || loadError
  // ReportView sets its own title once the report is ready.
  useDocumentTitle(completed ? null : failed ? 'Analysis failed' : 'Analyzing your history')

  if (completed) {
    const actions = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <ShareButton analysisId={id} report={analysis.result} />
        <DeleteReportButton analysisId={id} deleteToken={deleteToken} />
      </div>
    )
    return <ReportView data={analysis.result} filename={filename} actions={actions} stored />
  }

  if (failed) {
    return (
      <StatusScreen>
        <span style={{ fontSize: 40 }} aria-hidden="true">😕</span>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--text)', margin: 0 }}>
            We couldn’t analyze that file
          </p>
          <p style={{ fontSize: 13, color: '#fca5a5', marginTop: 8 }}>
            {loadError || analysis.error_message || 'Something went wrong.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            padding: '10px 24px', borderRadius: 100, border: '1px solid rgba(168,85,247,0.45)',
            background: 'rgba(168,85,247,0.1)', color: 'var(--accent-text)', fontFamily: 'var(--font-display)',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </StatusScreen>
    )
  }

  const copy = STATUS_COPY[analysis.status] || STATUS_COPY.pending

  return (
    <StatusScreen>
      <Spinner />
      <div role="status" aria-live="polite">
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--text)', margin: 0 }}>
          {copy.title}
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>{copy.body}</p>
      </div>
      {filename && (
        <p className="mono" style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', margin: 0 }}>{filename}</p>
      )}
      <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
        This page updates automatically. Large files can take a minute.
      </p>
    </StatusScreen>
  )
}
