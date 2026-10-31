import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getPricing } from '../../api/client'
import usePass from '../../pass/passContext'
import GetPassForm from '../../components/pass/GetPassForm'
import RestorePassForm from '../../components/pass/RestorePassForm'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { CURRENCIES, PLAN_FEATURES, browserCurrency, formatDate, formatPrice, priceFor } from '../../lib/pricing'

const CURRENCY_LABEL = { INR: '₹ INR', USD: '$ USD' }

function Cell({ value }) {
  if (value === true) return <><span aria-hidden="true" className="tick">✓</span><span className="sr-only">Included</span></>
  if (value === false) return <><span aria-hidden="true" className="dash">–</span><span className="sr-only">Not included</span></>
  return value
}

// /pricing: free vs Wrapped Pass, in ₹ or $, and the way to buy or restore it.
export default function PricingPage() {
  useDocumentTitle('Pricing')
  const pass = usePass()
  const [currency, setCurrency] = useState(browserCurrency)
  const [pricing, setPricing] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const { hash } = useLocation()

  // "I already have one" links to /pricing#restore; the router doesn't scroll to hashes.
  useEffect(() => {
    if (hash === '#restore') document.getElementById('restore')?.scrollIntoView?.({ block: 'start' })
  }, [hash])

  useEffect(() => {
    const controller = new AbortController()
    getPricing({ signal: controller.signal })
      .then(setPricing)
      .catch(() => { if (!controller.signal.aborted) setLoadError(true) })
    return () => controller.abort()
  }, [])

  const price = priceFor(pricing, currency)
  const days = pricing?.valid_days ?? 365
  const term = days === 365 ? '12 months' : `${days} days`

  return (
    <div className="doc-page">
      <header className="doc-header doc-header-wide">
        <Link to="/" className="doc-wordmark">BrowseWrapped</Link>
      </header>
      <main id="main" tabIndex={-1} className="pricing">
        <h1>Free to use. Pay once for the full story.</h1>
        <p className="pricing-intro">
          Every report and chart is free, with no sign-up. The Wrapped Pass is a one-time payment that adds the full
          story pack and more for {term}. It never renews.
        </p>

        <div className="currency-toggle" role="group" aria-label="Currency">
          {CURRENCIES.map((c) => (
            <button key={c} type="button" aria-pressed={currency === c} onClick={() => setCurrency(c)}>{CURRENCY_LABEL[c]}</button>
          ))}
        </div>

        <div className="plans">
          <section className="plan" aria-labelledby="plan-free">
            <h2 id="plan-free">Free</h2>
            <p className="plan-price">{formatPrice(0, currency)}</p>
            <p className="plan-note">Your full Wrapped, the persona card and the first story slide.</p>
            <Link to="/" className="btn-secondary">Make my Wrapped</Link>
          </section>

          <section className="plan plan-pass" aria-labelledby="plan-pass">
            <h2 id="plan-pass">Wrapped Pass</h2>
            {price ? (
              <>
                <p className="plan-price">
                  {formatPrice(price.amount, currency)}
                  {price.earlyBird && <s className="plan-regular"><span className="sr-only">Regular price </span>{formatPrice(price.regular, currency)}</s>}
                </p>
                <p className="plan-note">
                  One-time payment for {term}.
                  {price.earlyBird && <> Early-bird price until {formatDate(pricing.early_bird_until)}.</>}
                </p>
              </>
            ) : (
              <p className="plan-note" role={loadError ? 'alert' : 'status'}>
                {loadError ? 'We couldn’t load the price. Refresh the page to try again.' : 'Loading price…'}
              </p>
            )}
            {pass.hasPass ? (
              <p className="plan-active" role="status">
                <span aria-hidden="true">✓ </span>Your Pass is active{pass.validUntil ? ` until ${formatDate(pass.validUntil)}` : ''}.
              </p>
            ) : price && (
              <GetPassForm key={currency} currency={currency} priceLabel={formatPrice(price.amount, currency)} />
            )}
          </section>
        </div>

        <h2 className="pricing-h2">What’s included</h2>
        <div className="doc-table-wrap">
          <table className="doc-table doc-table-stack plan-table">
            <caption className="sr-only">Features of the free plan and the Wrapped Pass</caption>
            <thead>
              <tr><th scope="col">Feature</th><th scope="col">Free</th><th scope="col">Wrapped Pass</th></tr>
            </thead>
            <tbody>
              {PLAN_FEATURES.map((row) => (
                <tr key={row.feature}>
                  <th scope="row">{row.feature}</th>
                  <td data-label="Free"><span><Cell value={row.free} /></span></td>
                  <td data-label="Wrapped Pass">
                    <span>
                      <Cell value={row.pass} />
                      {row.soon && <span className="soon">Coming soon</span>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pricing-small">
          “Coming soon” features unlock automatically for every Pass holder when they ship. Prices include tax where it applies.
          Changed your mind? You get a full refund within 7 days. See the <Link to="/refund">Refund policy</Link>.
        </p>

        {!pass.hasPass && <RestorePassForm id="restore" />}
      </main>
    </div>
  )
}
