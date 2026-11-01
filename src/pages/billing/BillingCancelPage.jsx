import { Link } from 'react-router-dom'
import StatusScreen from '../../components/report/StatusScreen'
import useDocumentTitle from '../../hooks/useDocumentTitle'

// /billing/cancel: the buyer left the checkout.
export default function BillingCancelPage() {
  useDocumentTitle('Checkout cancelled')
  return (
    <StatusScreen>
      <span className="status-emoji" aria-hidden="true">↩️</span>
      <h1 className="status-title">Checkout cancelled</h1>
      <p className="status-body">Nothing was charged. Your free report and persona card still work as before.</p>
      <div className="status-actions">
        <Link to="/pricing" className="btn-primary">Back to pricing</Link>
        <Link to="/" className="text-link">Make my Wrapped</Link>
      </div>
    </StatusScreen>
  )
}
