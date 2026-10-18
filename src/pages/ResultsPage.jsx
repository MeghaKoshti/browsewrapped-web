import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ReportView from '../components/report/ReportView'

// Shows a report passed in router state (sample data, Chrome import).
export default function ResultsPage() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const data      = state?.data
  const filename  = state?.filename

  useEffect(() => {
    if (!data) navigate('/', { replace: true })
  }, [data, navigate])

  if (!data) return null

  return <ReportView data={data} filename={filename} />
}
