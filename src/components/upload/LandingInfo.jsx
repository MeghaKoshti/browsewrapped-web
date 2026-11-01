import { Link } from 'react-router-dom'
import { GUIDES, HOW_IT_WORKS, PRIVACY_FAQ } from '../../lib/seo'

// Below the upload box: how it works, the privacy FAQ (also sent as
// FAQPage JSON-LD) and links to the export guides.
export default function LandingInfo() {
  return (
    <div className="landing-info">
      <section aria-labelledby="how-title">
        <h2 id="how-title">How it works</h2>
        <ol className="how-steps">
          {HOW_IT_WORKS.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="guide-links">
          Export guides:{' '}
          {GUIDES.map((g, i) => <span key={g.id}>{i > 0 && ' · '}<Link to={g.path}>{g.label}</Link></span>)}
        </p>
      </section>

      <section aria-labelledby="faq-title">
        <h2 id="faq-title">Privacy questions</h2>
        <div className="faq">
          {PRIVACY_FAQ.map(({ q, a }) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <p className="guide-links">The full details are in our <Link to="/privacy">Privacy Policy</Link>.</p>
      </section>
    </div>
  )
}
