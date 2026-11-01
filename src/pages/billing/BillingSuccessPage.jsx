import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { requestMagicLink } from '../../api/client'
import usePass from '../../pass/passContext'
import { loadPassToken } from '../../lib/passSession'
import { formatDate } from '../../lib/pricing'
import StatusScreen, { Spinner } from '../../components/report/StatusScreen'
import RestorePassForm from '../../components/pass/RestorePassForm'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export const POLL_INTERVAL_MS = 2000
export const POLL_TIMEOUT_MS = 30_000
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// /billing/success?email=…: the payment provider sends buyers here. The Pass
// is created by the provider's webhook, which can land a few seconds later,
// so we poll /me until it shows up (or give up after 30 s). Without a
// session on this device we email a sign-in link instead. In development
// the fake checkout also adds ?token=… so the flow can be clicked through.
export default function BillingSuccessPage() {
  useDocumentTitle('Thanks for your purchase')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { signIn, refresh, validUntil } = usePass()
  const [email] = useState(() => params.get('email') || '')
  const [token] = useState(() => params.get('token'))
  const [phase, setPhase] = useState(token || loadPassToken() ? 'waiting' : 'sending') // waiting | active | timeout | sending | check-email
  const started = useRef(false)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    // StrictMode runs effects twice; the purchase flow must only run once.
    if (!started.current) {
      started.current = true
      // Sign-in tokens shouldn't stay in the address bar or browser history.
      if (token) navigate({ search: email ? `?email=${encodeURIComponent(email)}` : '' }, { replace: true })

      const run = async () => {
        if (token) await signIn(token).catch(() => {})
        if (!loadPassToken()) {
          if (email) await requestMagicLink(email).catch(() => {})
          if (alive.current) setPhase('check-email')
          return
        }
        for (let elapsed = 0; alive.current; elapsed += POLL_INTERVAL_MS) {
          const me = await refresh().catch(() => null)
          if (!alive.current) return
          if (me?.has_pass) return setPhase('active')
          if (!loadPassToken()) return setPhase('check-email')
          if (elapsed >= POLL_TIMEOUT_MS) return setPhase('timeout')
          await wait(POLL_INTERVAL_MS)
        }
      }
      run()
    }
    return () => { alive.current = false }
  }, [email, token, navigate, signIn, refresh])

  if (phase === 'active') {
    return (
      <StatusScreen>
        <span className="status-emoji" aria-hidden="true">🎉</span>
        <h1 className="status-title">Your Wrapped Pass is active</h1>
        <p className="status-body">
          {validUntil ? `It’s valid until ${formatDate(validUntil)}.` : 'It’s valid for 12 months.'} All five story slides are unlocked on this device.
          A receipt is on its way to your inbox.
        </p>
        <Link to="/" className="btn-primary">Make my Wrapped</Link>
      </StatusScreen>
    )
  }

  if (phase === 'check-email') {
    return (
      <StatusScreen>
        <span className="status-emoji" aria-hidden="true">📬</span>
        <h1 className="status-title">Thanks! Check your email</h1>
        <p className="status-body">
          {email
            ? <>We sent a sign-in link to <strong>{email}</strong>. Open it on this device to unlock your Pass. It works once, for 15 minutes.</>
            : 'Your payment went through. Use the email you paid with to get a sign-in link and unlock your Pass on this device.'}
        </p>
        <RestorePassForm title="Didn’t get it?" intro="Check your spam folder, or send a new link." />
      </StatusScreen>
    )
  }

  if (phase === 'timeout') {
    return (
      <StatusScreen>
        <span className="status-emoji" aria-hidden="true">⏳</span>
        <h1 className="status-title">Your Pass is taking longer than usual</h1>
        <p className="status-body" role="alert">
          We haven’t had the payment confirmation yet. It usually arrives within a minute. Refresh this page in a moment,
          or send yourself a sign-in link below. If you were charged and the Pass doesn’t appear, email us from the{' '}
          <Link to="/contact">Contact page</Link>.
        </p>
        <RestorePassForm title="Send a sign-in link" intro="Enter the email you paid with." />
      </StatusScreen>
    )
  }

  return (
    <StatusScreen>
      <Spinner />
      <div role="status" aria-live="polite">
        <h1 className="status-title">Thanks! Activating your Pass…</h1>
        <p className="status-body">This takes a few seconds. Please keep this page open.</p>
      </div>
    </StatusScreen>
  )
}
