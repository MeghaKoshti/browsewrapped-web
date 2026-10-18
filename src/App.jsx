import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import ResultsPage from './pages/ResultsPage'
import AnalysisPage from './pages/AnalysisPage'
import SharedReportPage from './pages/SharedReportPage'

export default function App() {
  return (
    <BrowserRouter>
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
