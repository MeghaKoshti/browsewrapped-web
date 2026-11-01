import { useState } from 'react'
import { createShareLink, deleteShareLink } from '../../api/client'
import { saveDeleteToken, forgetDeleteToken } from '../../lib/shareTokens'
import { errorMessage } from '../../api/errorMessage'
import { buildPersonaCardData, renderOgCardPng, OG_MAX_BYTES } from '../../lib/personaImage'

// The persona card as a 1200×630 PNG for the link preview, or null when this
// browser can't draw it (or it's too big). Sharing works without it.
async function previewCard(report) {
  const data = report && buildPersonaCardData(report)
  if (!data) return null
  try {
    const png = await renderOgCardPng(data)
    return png.size <= OG_MAX_BYTES ? png : null
  } catch {
    return null
  }
}

// A card the API refuses (wrong size or type) shouldn't stop the share.
const cardRejected = (err) => [413, 415, 422].includes(err?.response?.status)

const pillButton = {
  padding: '10px 22px',
  borderRadius: 100,
  border: '1px solid rgba(168,85,247,0.45)',
  background: 'rgba(168,85,247,0.12)',
  color: 'var(--accent-text)',
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
}

const linkButton = {
  background: 'none', border: 'none', padding: 0, fontSize: 12, color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer',
}

// "Share my report" → creates a public link with aggregated stats only. The
// link copied is the API's preview_url (/s/:token), which shows the persona
// card in WhatsApp, X and LinkedIn previews and then opens /r/:token.
//   analysisId – share a stored analysis (the server reads its result)
//   report     – the report shown; sent when there's no analysisId, and used for the card
export default function ShareButton({ analysisId, report }) {
  const [state, setState] = useState('idle') // idle | creating | created | deleting | deleted | error
  const [share, setShare] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const url = share ? share.preview_url || `${window.location.origin}${share.path}` : ''

  const create = async () => {
    setState('creating')
    setError('')
    try {
      const card = await previewCard(report)
      let created
      try {
        created = await createShareLink({ analysisId, report, card })
      } catch (err) {
        if (!card || !cardRejected(err)) throw err
        created = await createShareLink({ analysisId, report })
      }
      saveDeleteToken(created.token, created.delete_token)
      setShare(created)
      setState('created')
    } catch (err) {
      setError(errorMessage(err, 'Could not create a share link. Please try again.'))
      setState('error')
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const remove = async () => {
    setState('deleting')
    try {
      await deleteShareLink(share.token, share.delete_token)
      forgetDeleteToken(share.token)
      setState('deleted')
    } catch {
      setError('Could not delete the link. Please try again.')
      setState('created')
    }
  }

  if (state === 'created' || state === 'deleting') {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxWidth: '100%' }}>
        <div style={{ display: 'flex', gap: 8, maxWidth: '100%' }}>
          <input
            readOnly
            value={url}
            aria-label="Share link"
            onFocus={(e) => e.target.select()}
            className="mono"
            style={{
              width: 340, maxWidth: '60vw', padding: '9px 14px', borderRadius: 100, fontSize: 12,
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)',
            }}
          />
          <button type="button" onClick={copy} style={pillButton}>{copied ? 'Copied ✓' : 'Copy'}</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
          Only aggregated stats are shared. Expires {new Date(share.expires_at).toLocaleDateString()}.{' '}
          <button type="button" onClick={remove} disabled={state === 'deleting'} style={linkButton}>
            {state === 'deleting' ? 'Deleting…' : 'Delete link'}
          </button>
        </p>
        {error && <p style={{ fontSize: 12, color: '#fca5a5', margin: 0 }}>{error}</p>}
      </div>
    )
  }

  if (state === 'deleted') {
    return (
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
        Share link deleted.{' '}
        <button type="button" onClick={create} style={linkButton}>Create a new one</button>
      </p>
    )
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <button type="button" onClick={create} disabled={state === 'creating'} style={pillButton}>
        {state === 'creating' ? 'Creating link…' : '🔗 Share my report'}
      </button>
      {error && <p style={{ fontSize: 12, color: '#fca5a5', margin: 0 }}>{error}</p>}
    </div>
  )
}
