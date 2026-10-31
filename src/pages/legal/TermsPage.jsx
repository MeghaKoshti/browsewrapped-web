import { Link } from 'react-router-dom'
import DocPage from '../../components/layout/DocPage'
import { OPERATOR_NAME, CONTACT_EMAIL, JURISDICTION_CITY, MIN_AGE, REFUND_WINDOW_DAYS, formatLegalDate } from '../../lib/legal'

export default function TermsPage() {
  return (
    <DocPage
      title="Terms of Service"
      meta={`Last updated ${formatLegalDate()}`}
      intro="These terms apply when you use BrowseWrapped or buy a Wrapped Pass. They’re written to be read, so please do."
    >
      <h2>Who we are</h2>
      <p>
        BrowseWrapped is run by {OPERATOR_NAME}, an individual based in India (“we”). Contact us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>Using BrowseWrapped</h2>
      <ul>
        <li>You must be {MIN_AGE} or older.</li>
        <li>Only upload browser history that is yours, or that you have clear permission to use. Don’t use BrowseWrapped to monitor another person.</li>
        <li>Don’t try to break, overload or get around the limits of the service, or upload files meant to harm it.</li>
      </ul>

      <h2>Your data and your report</h2>
      <p>
        Your history and your report stay yours. You let us process them only to make your report and any share links you create.
        The <Link to="/privacy">Privacy Policy</Link> explains what is kept and for how long.
      </p>
      <p>
        Anyone with a share link can see what it shows (totals and topics), so share it only with people you choose.
        You can delete a link at any time.
      </p>

      <h2>The Wrapped Pass</h2>
      <ul>
        <li>The Pass is a <strong>one-time payment, not a subscription</strong>. It never renews or charges you again.</li>
        <li>It unlocks the Pass features for 12 months from the day you buy it, and is linked to the email you pay with.</li>
        <li>Payments are taken by Dodo Payments, who act as merchant of record and handle tax and invoices. Their checkout terms also apply.</li>
        <li>The price, including any tax, is shown before you pay.</li>
        <li>If we close BrowseWrapped or remove a main Pass feature while your Pass is valid, you can ask for a refund for the unused months.</li>
      </ul>
      <p>
        You can get a full refund within {REFUND_WINDOW_DAYS} days of buying. See the <Link to="/refund">Refund policy</Link>.
      </p>

      <h2>What a report is (and isn’t)</h2>
      <p>
        Reports are made automatically from whatever your browser recorded. Topics are best guesses and some will be wrong.
        BrowseWrapped is for fun and reflection, not professional, medical or productivity advice.
      </p>

      <h2>Availability and liability</h2>
      <p>
        We work hard to keep BrowseWrapped running, but it is provided “as is”, without guarantees that it will always be available
        or error-free. As far as the law allows, our total liability to you is limited to the amount you paid us in the 12 months
        before the claim. Nothing in these terms removes rights you have under consumer protection law.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms; the date at the top shows the latest version. If a change affects Wrapped Pass holders,
        we email them before it takes effect.
      </p>

      <h2>Law and disputes</h2>
      <p>
        These terms are governed by the laws of India. If a dispute can’t be settled by talking to us first, the courts at{' '}
        {JURISDICTION_CITY}, India have jurisdiction.
      </p>
    </DocPage>
  )
}
