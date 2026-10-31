import { Link } from 'react-router-dom'
import DocPage from '../../components/layout/DocPage'
import {
  OPERATOR_NAME, CONTACT_EMAIL, MIN_AGE, REPORT_RETENTION_DAYS, SHARE_LINK_DAYS, formatLegalDate,
} from '../../lib/legal'

// What happens to each piece of data, in the order a visitor meets it.
const DATA_FLOW = [
  {
    what: 'Your history file',
    where: 'The BrowseWrapped server (memory, or disk for large files)',
    kept: 'Only until it has been read, usually seconds. Then deleted.',
  },
  {
    what: 'Your report: totals, topics, top sites, top pages (address and title) and top searches',
    where: 'BrowseWrapped database',
    kept: `${REPORT_RETENTION_DAYS} days after upload, or until you select “Delete this report now”.`,
  },
  {
    what: 'Share link: totals and topics only, never addresses, page titles, searches or site names',
    where: 'BrowseWrapped database',
    kept: `${SHARE_LINK_DAYS} days, or until you delete the link.`,
  },
  {
    what: 'Up to 50 site names our rules don’t recognise (like example.com)',
    where: 'Google Gemini API, to pick a topic for each site',
    kept: 'Sent without your IP address, addresses, titles or searches. Site names that look private (localhost, IP addresses, internal company names) are never sent. The topic we get back is stored per site, not per person.',
  },
  {
    what: 'Email address and purchase record (only if you buy a Wrapped Pass)',
    where: 'Our payment provider and the BrowseWrapped database',
    kept: 'While your Pass is valid, then as long as tax and accounting law requires.',
  },
  {
    what: 'Sign-in links for your Pass',
    where: 'Your email inbox; we store only a scrambled (hashed) copy of the link',
    kept: 'Each link works once, for 15 minutes.',
  },
  {
    what: 'Server logs: IP address, time and the page requested',
    where: 'Our hosting provider',
    kept: 'A short time, for security and fixing errors. Logs never contain your file or report.',
  },
]

const PROCESSORS = [
  { name: 'Fly.io', role: 'Runs the BrowseWrapped server and database.' },
  { name: 'Vercel', role: 'Serves the website pages.' },
  { name: 'Google (Gemini API)', role: 'Suggests a topic for unrecognised site names.' },
  { name: 'Dodo Payments', role: 'Takes payments for the Wrapped Pass as merchant of record. We never see your card or UPI details.' },
  { name: 'Our email provider', role: 'Sends Pass sign-in links and receipts.' },
  { name: 'Analytics', role: 'None today. If we add it, it will be cookie-free, count only totals, and be listed here first.' },
]

const BROWSER_STORAGE = [
  { key: 'bw.deleteTokens', place: 'session storage', why: 'Lets the tab that uploaded a file delete its report. Gone when you close the tab.' },
  { key: 'browsewrapped:share:…', place: 'local storage', why: 'Lets you delete share links you made on this device.' },
  { key: 'bw.passToken', place: 'local storage', why: 'Keeps your Wrapped Pass signed in on this device for up to 30 days.' },
]

export default function PrivacyPage() {
  return (
    <DocPage
      title="Privacy Policy"
      meta={`Last updated ${formatLegalDate()}`}
      intro="BrowseWrapped turns your browser history into a report. History is personal, so we keep as little as we can, for as short a time as we can, and we never sell it."
    >
      <h2>Who is responsible</h2>
      <p>
        BrowseWrapped is run by {OPERATOR_NAME}, an individual based in India, who decides how your data is used
        (the “data fiduciary” under India’s Digital Personal Data Protection Act, 2023, and the “controller” under the GDPR).
        Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>What happens to your data</h2>
      <div className="doc-table-wrap">
        <table className="doc-table">
          <caption className="sr-only">Each kind of data, where it goes and how long it is kept</caption>
          <thead>
            <tr><th scope="col">Data</th><th scope="col">Where it goes</th><th scope="col">How long</th></tr>
          </thead>
          <tbody>
            {DATA_FLOW.map((row) => (
              <tr key={row.what}><th scope="row">{row.what}</th><td>{row.where}</td><td>{row.kept}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Try the sample report and nothing about you is stored. We don’t sell data, show ads or build profiles,
        and we don’t use your history to train AI models.
      </p>

      <h2>Why we use it</h2>
      <ul>
        <li><strong>To make your report and share links</strong>, because you asked us to (your consent, which you give by uploading).</li>
        <li><strong>To sell and honour a Wrapped Pass</strong>, because we have a contract with you.</li>
        <li><strong>To keep the service secure and working</strong> (server logs, rate limits), a legitimate use the law allows.</li>
      </ul>

      <h2>Service providers</h2>
      <p>These companies process data for us, only to provide BrowseWrapped. Some of their servers are outside India.</p>
      <ul>
        {PROCESSORS.map((p) => <li key={p.name}><strong>{p.name}:</strong> {p.role}</li>)}
      </ul>

      <h2>Cookies and browser storage</h2>
      <p>BrowseWrapped sets no cookies. It saves these small items in your browser:</p>
      <ul>
        {BROWSER_STORAGE.map((s) => <li key={s.key}><code>{s.key}</code> ({s.place}): {s.why}</li>)}
      </ul>

      <h2>Your rights</h2>
      <p>Wherever you live, you can ask us to:</p>
      <ul>
        <li><strong>Access</strong> the data we hold about you, and a summary of how we use it.</li>
        <li><strong>Correct</strong> it if it’s wrong.</li>
        <li><strong>Erase</strong> it. For a report, select “Delete this report now” on the report page; for anything else, email us.</li>
        <li><strong>Withdraw consent</strong> at any time. It doesn’t affect what we did before.</li>
        <li><strong>Nominate</strong> someone to act for you if you die or can’t act yourself (India).</li>
        <li><strong>Get a copy, restrict or object</strong> to how we use it (EU and UK).</li>
      </ul>
      <p>
        Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address involved. We reply within 30 days.
      </p>

      <h2>Grievances and complaints</h2>
      <p>
        Our grievance contact is {OPERATOR_NAME}, <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. If you’re not happy
        with our answer, you can complain to the Data Protection Board of India, or in the EU or UK to your local data protection authority.
      </p>

      <h2>Children</h2>
      <p>
        BrowseWrapped is not intended for anyone under {MIN_AGE}. Please don’t upload a child’s history or buy a Pass for a child.
        If we learn we hold a child’s data, we delete it.
      </p>

      <h2>Security</h2>
      <p>
        Connections are encrypted (HTTPS). Delete keys and sign-in links are stored only as hashes. Uploaded databases are opened
        read-only in a private temporary folder and removed afterwards.
      </p>

      <h2>Changes</h2>
      <p>
        When this policy changes, we update the date at the top. If a change affects Wrapped Pass holders, we email them first.
        See also the <Link to="/terms">Terms</Link> and <Link to="/refund">Refund policy</Link>.
      </p>
    </DocPage>
  )
}
