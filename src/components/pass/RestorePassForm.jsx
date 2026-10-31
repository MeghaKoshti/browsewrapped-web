import { useId, useState } from 'react'
import { requestMagicLink } from '../../api/client'
import { errorMessage } from '../../api/errorMessage'

// "Restore my Pass": emails a single-use sign-in link. The API answers the
// same way whether or not the email has a Pass, and so does this form.
export default function RestorePassForm({ title = 'Restore my Pass', intro = 'Bought a Pass on another device? Enter the email you paid with and we’ll send you a sign-in link.' }) {
  const id = useId()
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setState('sending')
    setError('')
    try {
      await requestMagicLink(email.trim())
      setState('sent')
    } catch (err) {
      setError(errorMessage(err, 'We couldn’t send the link. Check your connection and try again.'))
      setState('error')
    }
  }

  return (
    <section className="restore" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {state === 'sent' ? (
        <p role="status" className="restore-sent">
          Check your inbox. If <strong>{email.trim()}</strong> has a Wrapped Pass, a sign-in link is on its way.
          It works once, for 15 minutes.{' '}
          <button type="button" className="text-button" onClick={() => setState('idle')}>Use a different email</button>
        </p>
      ) : (
        <form className="restore-form" onSubmit={submit}>
          <p>{intro}</p>
          <div className="restore-row">
            <label htmlFor={`${id}-email`} className="sr-only">Email you paid with</label>
            <input
              id={`${id}-email`} type="email" required autoComplete="email" inputMode="email" placeholder="Email you paid with"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn-secondary" disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          </div>
          {error && <p role="alert" className="form-error">{error}</p>}
        </form>
      )}
    </section>
  )
}
