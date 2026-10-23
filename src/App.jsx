import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import ResultsPage from './pages/ResultsPage'
import AnalysisPage from './pages/AnalysisPage'
import SharedReportPage from './pages/SharedReportPage'
import SkipLink from './components/ui/SkipLink'

export default function App() {
  return (
    <BrowserRouter>
      <SkipLink />
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/analyses/:id" element={<AnalysisPage />} />
        <Route path="/r/:token" element={<SharedReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
