import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'

export default function Protected() {
  const { user, loading, refresh } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlToken = params.get('token')
    if (urlToken && !localStorage.getItem('auth_token')) {
      localStorage.setItem('auth_token', urlToken)
      setProcessing(true)
      refresh().finally(() => {
        setProcessing(false)
        // Clean query string
        navigate(location.pathname, { replace: true })
      })
    }
  }, [location.search, location.pathname, refresh, navigate])

  if (loading || processing) return <div className="p-8">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
