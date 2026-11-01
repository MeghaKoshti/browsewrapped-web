import { useId, useState } from 'react'
import { createCheckout } from '../../api/client'
import { errorMessage } from '../../api/errorMessage'
import { isSafeRedirect } from '../../lib/pricing'

// "Get the Pass": asks for an email, starts a checkout and leaves for the
// payment page. `redirect` is injectable so tests don't navigate.
export default function GetPassForm({ currency, priceLabel, redirect = (url) => window.location.assign(url) }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | sending | error
  const [error, setError] = useState('')

  if (!open) {
    return (
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        Get the Pass
      </button>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setState('sending')
    setError('')
    try {
      const { checkout_url: url } = await createCheckout({ email: email.trim(), currency })
      if (!isSafeRedirect(url)) throw new Error('Unexpected checkout address')
      redirect(url)
    } catch (err) {
      setError(errorMessage(err, 'We couldn’t start the checkout. Nothing was charged. Please try again.'))
      setState('error')
    }
  }

  const sending = state === 'sending'
  return (
    <form className="pass-form" onSubmit={submit} noValidate={false}>
      <label htmlFor={`${id}-email`}>Your email</label>
      <p id={`${id}-help`} className="pass-form-help">Your Pass is linked to this email, so you can unlock it on any device.</p>
      <input
        id={`${id}-email`} type="email" required autoComplete="email" inputMode="email" autoFocus
        value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby={`${id}-help`}
        placeholder="name@example.com"
      />
      <button type="submit" className="btn-primary" disabled={sending} aria-busy={sending}>
        {sending ? 'Opening checkout…' : `Continue to payment${priceLabel ? ` (${priceLabel})` : ''}`}
      </button>
      <p className="pass-form-help">One-time payment. No subscription, nothing renews.</p>
      {error && <p role="alert" className="form-error">{error}</p>}
    </form>
  )
}
