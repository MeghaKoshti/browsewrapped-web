import { Link } from 'react-router-dom'
import DocPage from '../../components/layout/DocPage'
import { OPERATOR_NAME, CONTACT_EMAIL, formatLegalDate } from '../../lib/legal'

export default function ContactPage() {
  return (
    <DocPage
      title="Contact"
      meta={`Last updated ${formatLegalDate()}`}
      intro="BrowseWrapped is made and run by one person in India. Email is the best way to reach us."
    >
      <p className="doc-callout">
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <span>Usually answered within 3 working days.</span>
      </p>

      <h2>Write for</h2>
      <ul>
        <li><strong>Refunds:</strong> use the subject “Wrapped Pass refund”. See the <Link to="/refund">Refund policy</Link>.</li>
        <li><strong>Privacy requests</strong> (access, correction, deletion) and <strong>grievances</strong>: our grievance contact is {OPERATOR_NAME}. See the <Link to="/privacy">Privacy Policy</Link>.</li>
        <li><strong>Bugs and ideas:</strong> tell us what you tried and which browser you used. Please don’t attach your history file.</li>
      </ul>

      <h2>Operator</h2>
      <p>{OPERATOR_NAME}, an individual based in India.</p>
    </DocPage>
  )
}
