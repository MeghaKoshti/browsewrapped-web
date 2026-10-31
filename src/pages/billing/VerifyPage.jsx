import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import usePass, { passStateFrom } from '../../pass/passContext'
import { formatDate } from '../../lib/pricing'
import StatusScreen, { Spinner } from '../../components/report/StatusScreen'
import RestorePassForm from '../../components/pass/RestorePassForm'
import useDocumentTitle from '../../hooks/useDocumentTitle'

// /auth/verify?token=…: the link from the "Restore my Pass" email. Swaps the
// single-use token for a Pass session on this device.
export default function VerifyPage() {
  useDocumentTitle('Unlock your Pass')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { signIn } = usePass()
  const [token] = useState(() => params.get('token'))
  const [result, setResult] = useState(token ? null : { error: true })
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    // Single-use tokens shouldn't stay in the address bar or history.
    navigate({ search: '' }, { replace: true })
    signIn(token).then((session) => setResult({ session, active: passStateFrom(session).hasPass }), () => setResult({ error: true }))
  }, [token, navigate, signIn])

  if (!result) {
    return (
      <StatusScreen>
        <Spinner />
        <p role="status" className="status-title">Unlocking your Pass…</p>
      </StatusScreen>
    )
  }

  if (result.error) {
    return (
      <StatusScreen>
        <span className="status-emoji" aria-hidden="true">🔗</span>
        <h1 className="status-title">This link has expired or was already used</h1>
        <p className="status-body">Sign-in links work once, for 15 minutes. Request a new one below.</p>
        <RestorePassForm title="Send a new link" intro="Enter the email you paid with." />
      </StatusScreen>
    )
  }

  const { email, pass_valid_until: until } = result.session
  const { active } = result
  return (
    <StatusScreen>
      <span className="status-emoji" aria-hidden="true">{active ? '✨' : '🔒'}</span>
      <h1 className="status-title">{active ? 'Your Pass is unlocked on this device' : 'No active Pass for this email'}</h1>
      <p className="status-body">
        {active
          ? <>Signed in as <strong>{email}</strong>. Your Pass is valid until {formatDate(until)}.</>
          : <>Signed in as <strong>{email}</strong>, but this email has no active Wrapped Pass{until ? ` (it ended on ${formatDate(until)})` : ''}.</>}
      </p>
      <div className="status-actions">
        <Link to="/" className="btn-primary">Make my Wrapped</Link>
        {!active && <Link to="/pricing" className="text-link">See pricing</Link>}
      </div>
    </StatusScreen>
  )
}
