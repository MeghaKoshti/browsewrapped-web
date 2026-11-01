import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import SkipLink from './components/ui/SkipLink'
import SiteFooter from './components/layout/SiteFooter'
import PassProvider from './pass/PassProvider'
import { ReportSkeleton } from './components/ui/Skeleton'

// Report pages pull in Recharts and D3, so they load on demand. The upload
// page (the first thing most visitors see) stays in the main bundle.
const ResultsPage = lazy(() => import('./pages/ResultsPage'))
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'))
const SharedReportPage = lazy(() => import('./pages/SharedReportPage'))
// Legal, pricing and billing pages are rarely the first page, so they never
// weigh on the first load.
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/legal/TermsPage'))
const RefundPage = lazy(() => import('./pages/legal/RefundPage'))
const ContactPage = lazy(() => import('./pages/legal/ContactPage'))
const PricingPage = lazy(() => import('./pages/billing/PricingPage'))
const BillingSuccessPage = lazy(() => import('./pages/billing/BillingSuccessPage'))
const BillingCancelPage = lazy(() => import('./pages/billing/BillingCancelPage'))
const VerifyPage = lazy(() => import('./pages/billing/VerifyPage'))
const GuidePage = lazy(() => import('./pages/guide/GuidePage'))

export default function App() {
  return (
    <BrowserRouter>
      <PassProvider>
        <SkipLink />
        <Suspense fallback={<ReportSkeleton />}>
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/analyses/:id" element={<AnalysisPage />} />
            <Route path="/r/:token" element={<SharedReportPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/refund" element={<RefundPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/billing/success" element={<BillingSuccessPage />} />
            <Route path="/billing/cancel" element={<BillingCancelPage />} />
            <Route path="/auth/verify" element={<VerifyPage />} />
            <Route path="/guide/:browser" element={<GuidePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <SiteFooter />
        </Suspense>
      </PassProvider>
    </BrowserRouter>
  )
}
