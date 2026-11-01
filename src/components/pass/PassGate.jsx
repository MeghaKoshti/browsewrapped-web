import { Link } from 'react-router-dom'
import usePass from '../../pass/passContext'

// Shows `children` to Pass holders and an upgrade prompt to everyone else.
//   title       – what is locked, e.g. "Unlock all 5 story slides"
//   description – one line on what the Pass adds here
//   compact     – a one-line prompt for tight spots
export default function PassGate({ title, description, compact = false, children }) {
  const { status, hasPass } = usePass()
  if (hasPass) return children
  // Don't flash a paywall at a Pass holder while /me is still answering.
  if (status === 'loading') return <p role="status" className="pass-gate-loading">Checking your Pass…</p>
  return <UpgradePrompt title={title} description={description} compact={compact} expired={status === 'expired'} />
}

export function UpgradePrompt({ title, description, compact = false, expired = false }) {
  return (
    <div className={`pass-gate${compact ? ' pass-gate-compact' : ''}`} role="group" aria-label={title}>
      <span className="pass-gate-lock" aria-hidden="true">🔒</span>
      <div className="pass-gate-text">
        <p className="pass-gate-title">{title}</p>
        {!compact && description && <p className="pass-gate-body">{description}</p>}
        {expired && <p className="pass-gate-body">Your Wrapped Pass has ended. Get a new one to unlock this again.</p>}
      </div>
      <div className="pass-gate-actions">
        <Link to="/pricing" className="btn-primary">Get the Pass</Link>
        <Link to="/pricing#restore" className="text-link">I already have one</Link>
      </div>
    </div>
  )
}
