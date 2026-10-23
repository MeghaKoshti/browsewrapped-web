import { useState } from 'react'
import { buildPersonaCardData, personaCardFilename, renderPersonaCardPng, downloadBlob } from '../../lib/personaImage'

// "Download image" — saves the persona card as a 1080×1350 PNG made in the
// browser. Nothing is uploaded.
export default function DownloadCardButton({ report, color = '#a855f7' }) {
  const [state, setState] = useState('idle') // idle | working | error

  const download = async () => {
    const data = buildPersonaCardData(report)
    if (!data) return
    setState('working')
    try {
      const blob = await renderPersonaCardPng(data)
      downloadBlob(blob, personaCardFilename(data))
      setState('idle')
    } catch {
      setState('error')
    }
  }

  const working = state === 'working'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={download}
        disabled={working}
        aria-busy={working}
        style={{
          padding: '9px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600,
          fontFamily: 'var(--font-display)', cursor: working ? 'progress' : 'pointer',
          border: `1px solid ${color}`, background: 'rgba(255,255,255,0.04)', color: 'var(--text)',
        }}
      >
        {working ? 'Preparing image…' : 'Download image'}
      </button>
      <span role="status" style={{ fontSize: 12, color: state === 'error' ? '#fca5a5' : 'var(--muted)' }}>
        {state === 'error' ? 'Your browser couldn’t create the image. Try another browser.' : ''}
      </span>
    </div>
  )
}
