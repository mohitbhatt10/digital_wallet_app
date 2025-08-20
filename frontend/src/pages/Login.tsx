import { useState } from 'react'
import { login } from '../api/auth'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080'

export default function Login() {
  const [usernameOrEmail, setU] = useState('')
  const [password, setP] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { refresh } = useAuth()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const token = await login({ usernameOrEmail, password })
  localStorage.setItem('auth_token', token)
  await refresh()
  navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold text-zinc-900">Login</h2>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Email or Username</label>
          <input className="input" placeholder="you@example.com" value={usernameOrEmail} onChange={e => setU(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
          <input className="input" placeholder="********" type="password" value={password} onChange={e => setP(e.target.value)} />
        </div>
  <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      <div className="mt-4">
        <button className="btn-secondary w-full" type="button" onClick={() => { window.location.href = `${API_BASE}/oauth2/authorization/google` }}>Login with Google</button>
      </div>
    </div>
  )
}
