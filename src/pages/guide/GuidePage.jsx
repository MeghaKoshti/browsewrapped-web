import { Link, Navigate, useParams } from 'react-router-dom'
import { GUIDES, findGuide } from '../../lib/seo'
import { SQLITE_TIP } from '../../lib/exportGuide'
import useDocumentTitle from '../../hooks/useDocumentTitle'

function Method({ method }) {
  return (
    <>
      <h2>{method.title}</h2>
      <ol>{method.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      {method.file && <p className="doc-tip">{SQLITE_TIP}</p>}
      {method.paths.length > 0 && (
        <ul className="guide-paths">
          {method.paths.map((p) => <li key={p.os}><strong>{p.label}</strong><code>{p.path}</code><span>{p.hint}</span></li>)}
        </ul>
      )}
      {method.link && <p><a href={method.link.href} target="_blank" rel="noopener noreferrer">{method.link.text}<span className="sr-only"> (opens in a new tab)</span></a></p>}
      {method.note && <p>{method.note}</p>}
    </>
  )
}

// /guide/:browser — the export guide as its own page. The build also writes
// a static copy of it (src/lib/seo.js → renderGuideHtml) with the same
// markup, so search engines and no-JS visitors get the full text.
export default function GuidePage() {
  const guide = findGuide(useParams().browser)
  useDocumentTitle(guide ? guide.h1 : null)
  if (!guide) return <Navigate to="/" replace />

  const others = GUIDES.filter((g) => g.id !== guide.id)
  return (
    <div className="doc-page">
      <header className="doc-header"><Link to="/" className="doc-wordmark">BrowseWrapped</Link></header>
      <main id="main" tabIndex={-1} className="doc guide">
        <h1>{guide.h1}</h1>
        <p className="doc-intro">{guide.intro}</p>
        {guide.methods.map((m) => <Method key={m.title} method={m} />)}
        <section className="guide-cta" aria-labelledby="guide-cta-title">
          <h2 id="guide-cta-title">Got the file? Make your Wrapped</h2>
          <p>Upload it on the home page. The file is deleted as soon as it has been analysed, and your report is free.</p>
          <Link className="btn-primary" to="/">Upload my history</Link>
        </section>
        <p className="guide-others">
          Other browsers:{' '}
          {others.map((g, i) => <span key={g.id}>{i > 0 && ', '}<Link to={g.path}>{g.label}</Link></span>)}.
        </p>
      </main>
    </div>
  )
}
