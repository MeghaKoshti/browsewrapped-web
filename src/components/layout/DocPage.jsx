import { Link } from 'react-router-dom'
import useDocumentTitle from '../../hooks/useDocumentTitle'

// A plain reading page (legal pages, guides): wordmark, one column of text.
// Styled with classes from index.css only, so it also looks right when the
// HTML is prerendered and served under the strict CSP.
export default function DocPage({ title, intro = null, meta = null, children }) {
  useDocumentTitle(title)
  return (
    <div className="doc-page">
      <header className="doc-header">
        <Link to="/" className="doc-wordmark">BrowseWrapped</Link>
      </header>
      <main id="main" tabIndex={-1} className="doc">
        <h1>{title}</h1>
        {meta && <p className="doc-meta">{meta}</p>}
        {intro && <p className="doc-intro">{intro}</p>}
        {children}
      </main>
    </div>
  )
}
