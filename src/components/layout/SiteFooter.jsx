import { Link } from 'react-router-dom'
import PassStatus from '../pass/PassStatus'
import { FOOTER_LINKS } from '../../lib/seo'

// Shown under every page, including shared reports and the legal pages.
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <PassStatus />
      <nav aria-label="Footer">
        <ul>
          {FOOTER_LINKS.map((l) => <li key={l.to}><Link to={l.to}>{l.label}</Link></li>)}
        </ul>
      </nav>
      <p>© {new Date().getFullYear()} BrowseWrapped. Your history stays yours.</p>
    </footer>
  )
}
