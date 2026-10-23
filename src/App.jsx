import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import SkipLink from './components/ui/SkipLink'
import { ReportSkeleton } from './components/ui/Skeleton'

// Report pages pull in Recharts and D3, so they load on demand. The upload
// page (the first thing most visitors see) stays in the main bundle.
const ResultsPage = lazy(() => import('./pages/ResultsPage'))
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'))
const SharedReportPage = lazy(() => import('./pages/SharedReportPage'))

export default function App() {
  return (
    <BrowserRouter>
      <SkipLink />
      <Suspense fallback={<ReportSkeleton />}>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/analyses/:id" element={<AnalysisPage />} />
          <Route path="/r/:token" element={<SharedReportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
