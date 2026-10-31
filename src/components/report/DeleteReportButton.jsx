import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAnalysis } from '../../api/client'
import { forgetAnalysisDeleteToken } from '../../lib/deleteTokens'
import { errorMessage } from '../../api/errorMessage'

export const DELETED_NOTICE = 'Your report was deleted from our server. Nothing from that upload is kept.'

const textButton = {
  background: 'none', border: 'none', padding: '4px 2px', fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
  fontFamily: 'var(--font-display)',
}

// "Delete this report now": removes the stored analysis (report, top pages,
// searches) from the API straight away instead of waiting for the 7-day
// cleanup. Asks once before deleting, because it can't be undone.
export default function DeleteReportButton({ analysisId, deleteToken }) {
  const navigate = useNavigate()
  const [state, setState] = useState('idle') // idle | confirming | deleting
  const [error, setError] = useState('')

  if (!deleteToken) return null

  const finish = () => {
    forgetAnalysisDeleteToken(analysisId)
    navigate('/', { replace: true, state: { notice: DELETED_NOTICE } })
  }

  const remove = async () => {
    setState('deleting')
    setError('')
    try {
      await deleteAnalysis(analysisId, deleteToken)
      finish()
    } catch (err) {
      // Already gone (expired or deleted in another tab) is what the user wanted.
      if (err?.response?.status === 404) return finish()
      setState('confirming')
      setError(err?.response?.status === 403
        ? 'This browser can’t delete this report: the delete key doesn’t match. It will still be deleted automatically 7 days after upload.'
        : errorMessage(err, 'We couldn’t delete the report. Check your connection and try again.'))
    }
  }

  if (state === 'idle') {
    return (
      <button type="button" onClick={() => setState('confirming')} style={{ ...textButton, color: 'var(--muted)' }}>
        Delete this report now
      </button>
    )
  }

  const deleting = state === 'deleting'
  return (
    <div
      role="group"
      aria-labelledby="delete-report-title"
      style={{
        maxWidth: 420, margin: '0 auto', padding: '14px 16px', borderRadius: 14, textAlign: 'left',
        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
      }}
    >
      <p id="delete-report-title" style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
        Delete this report?
      </p>
      <p style={{ margin: '4px 0 12px', fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
        The report, including your top pages and searches, is removed from our server now. This can’t be undone.
        Share links you made from it stay until you delete them or they expire.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          aria-busy={deleting}
          style={{
            padding: '8px 18px', borderRadius: 100, border: '1px solid rgba(239,68,68,0.6)', background: 'rgba(239,68,68,0.16)',
            color: '#fecaca', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, cursor: deleting ? 'progress' : 'pointer',
          }}
        >
          {deleting ? 'Deleting…' : 'Delete report'}
        </button>
        <button type="button" onClick={() => { setState('idle'); setError('') }} disabled={deleting} style={{ ...textButton, color: 'var(--text)' }}>
          Keep report
        </button>
      </div>
      {error && <p role="alert" style={{ margin: '10px 0 0', fontSize: 12, color: '#fca5a5' }}>{error}</p>}
    </div>
  )
}
