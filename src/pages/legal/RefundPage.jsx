import { Link } from 'react-router-dom'
import DocPage from '../../components/layout/DocPage'
import { CONTACT_EMAIL, REFUND_WINDOW_DAYS, formatLegalDate } from '../../lib/legal'

export default function RefundPage() {
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Wrapped Pass refund')}`
  return (
    <DocPage
      title="Refund Policy"
      meta={`Last updated ${formatLegalDate()}`}
      intro={`Changed your mind about the Wrapped Pass? Ask within ${REFUND_WINDOW_DAYS} days and you get all your money back. No questions asked.`}
    >
      <h2>What you can get back</h2>
      <ul>
        <li><strong>Within {REFUND_WINDOW_DAYS} days of buying:</strong> a full refund, for any reason.</li>
        <li><strong>Charged twice or by mistake:</strong> always refunded, whenever you notice.</li>
        <li><strong>If we close BrowseWrapped or remove a main Pass feature</strong> while your Pass is valid: a refund for the unused months.</li>
        <li>After {REFUND_WINDOW_DAYS} days, other refunds are only given where the law requires.</li>
      </ul>
      <p>The Pass is a one-time payment, so there is never a renewal to cancel.</p>

      <h2>How to ask</h2>
      <ol>
        <li>
          Email <a href={mailto}>{CONTACT_EMAIL}</a> with the subject “Wrapped Pass refund”, from the email you paid with
          (or include that email in your message).
        </li>
        <li>Add your receipt number if you have it. It helps us find the payment faster.</li>
      </ol>
      <p>You can also reply to your payment receipt email.</p>

      <h2>What happens next</h2>
      <ul>
        <li>We confirm within 3 working days and refund the full amount through our payment provider, Dodo Payments.</li>
        <li>The money goes back to the card, UPI account or other method you paid with. Banks usually take 5–10 working days to show it.</li>
        <li>Your Pass ends when the refund is made. Everything free keeps working.</li>
      </ul>

      <h2>Checkout cancelled or failed?</h2>
      <p>
        If you left the checkout or the payment failed, nothing was charged and there’s nothing to refund. If money left your account anyway,
        email us and we’ll sort it out. See also the <Link to="/terms">Terms</Link>.
      </p>
    </DocPage>
  )
}
