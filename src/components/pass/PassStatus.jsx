import { Link } from 'react-router-dom'
import usePass from '../../pass/passContext'
import { formatDate } from '../../lib/pricing'

// "Wrapped Pass active until …", with a way to sign this device out.
// Renders nothing for visitors without a Pass session.
export default function PassStatus() {
  const { hasPass, status, email, validUntil, signOut, sessionExpired } = usePass()
  if (sessionExpired) {
    return (
      <p className="pass-status pass-status-muted">
        Your Pass sign-in on this device has expired. <Link to="/pricing#restore">Restore my Pass</Link>
      </p>
    )
  }
  if (!hasPass && status !== 'expired') return null
  return (
    <p className="pass-status">
      {hasPass
        ? <>Wrapped Pass active{validUntil ? ` until ${formatDate(validUntil)}` : ''}</>
        : <>Your Wrapped Pass ended{validUntil ? ` on ${formatDate(validUntil)}` : ''}</>}
      {email && <span className="pass-status-email"> · {email}</span>}
      {' · '}
      <button type="button" className="text-button" onClick={signOut}>Sign out on this device</button>
    </p>
  )
}
