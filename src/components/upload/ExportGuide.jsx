import { useId, useRef, useState } from 'react'
import { BROWSERS, OS_LABELS, OPEN_FOLDER_HINTS, SQLITE_TIP, orderedPaths } from '../../lib/exportGuide'

// "Where to find your history file": one tab per browser, following the
// WAI-ARIA tabs pattern (roving tabindex, arrow keys, Home/End).
export default function ExportGuide({ initialBrowser = 'chrome', os = null }) {
  const startIndex = Math.max(0, BROWSERS.findIndex((b) => b.id === initialBrowser))
  const [selected, setSelected] = useState(startIndex)
  const tabRefs = useRef([])
  const baseId = useId()
  const tabId = (i) => `${baseId}-tab-${BROWSERS[i].id}`
  const panelId = (i) => `${baseId}-panel-${BROWSERS[i].id}`

  const select = (i) => {
    setSelected(i)
    tabRefs.current[i]?.focus()
  }

  const onKeyDown = (e) => {
    const last = BROWSERS.length - 1
    const next = { ArrowRight: selected === last ? 0 : selected + 1, ArrowLeft: selected === 0 ? last : selected - 1, Home: 0, End: last }[e.key]
    if (next === undefined) return
    e.preventDefault()
    select(next)
  }

  const browser = BROWSERS[selected]

  return (
    <section aria-labelledby={`${baseId}-title`} className="card" style={{ marginTop: 14, padding: '20px 16px 18px', textAlign: 'left' }}>
      <h2 id={`${baseId}-title`} style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '0 4px 14px' }}>
        Where to find your history file
      </h2>

      <div role="tablist" aria-label="Browser" onKeyDown={onKeyDown} style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {BROWSERS.map((b, i) => {
          const active = i === selected
          return (
            <button
              key={b.id}
              ref={(el) => { tabRefs.current[i] = el }}
              type="button"
              role="tab"
              id={tabId(i)}
              aria-selected={active}
              aria-controls={panelId(i)}
              tabIndex={active ? 0 : -1}
              onClick={() => select(i)}
              style={{
                flex: '1 1 auto', padding: '10px 4px', marginBottom: -1, background: 'none', border: 'none',
                borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                color: active ? 'var(--text)' : 'var(--muted)', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
              }}
            >
              {b.label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id={panelId(selected)} aria-labelledby={tabId(selected)} tabIndex={0} style={{ padding: '16px 4px 0', outlineOffset: 2 }}>
        {browser.methods.map((m) => <Method key={m.title} method={m} os={os} />)}
      </div>

    </section>
  )
}

function Method({ method, os }) {
  const paths = orderedPaths(method.paths, os)
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>{method.title}</h3>
      <ol style={{ listStyle: 'decimal', margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
        {method.steps.map((s) => <li key={s}>{s}</li>)}
      </ol>

      {method.file && (
        <p style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--text)', margin: '10px 0 0', padding: '8px 12px', borderRadius: 10, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)' }}>
          {SQLITE_TIP}
        </p>
      )}

      {paths.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {paths.map(({ os: key, path }) => <PathRow key={key} os={key} path={path} />)}
        </ul>
      )}

      {method.link && (
        <p style={{ margin: '10px 0 0', fontSize: 13 }}>
          <a href={method.link.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-text)' }}>
            {method.link.text}<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      )}

      {method.note && <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, margin: '8px 0 0' }}>{method.note}</p>}
    </div>
  )
}

function PathRow({ os, path }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(path)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (permissions, http): the path is still selectable.
    }
  }

  return (
    <li style={{ padding: '8px 10px 8px 12px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{OS_LABELS[os]}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${OS_LABELS[os]} path`}
          style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, border: '1px solid var(--border-hi)', background: 'none', color: copied ? 'var(--accent-text)' : 'var(--muted)', cursor: 'pointer' }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <code className="mono" style={{ display: 'block', marginTop: 4, fontSize: 12, color: 'var(--text)', overflowWrap: 'anywhere', lineHeight: 1.5 }}>{path}</code>
      <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0', lineHeight: 1.5 }}>{OPEN_FOLDER_HINTS[os]}</p>
      <span role="status" className="sr-only">{copied ? 'Path copied' : ''}</span>
    </li>
  )
}
