import { useState } from 'react'
import { signup } from '../api/auth'
import { useNavigate, Link } from 'react-router-dom'

export default function Signup() {
  const [form, setForm] = useState({ email: '', username: '', password: '', firstName: '', lastName: '', phoneNumber: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const token = await signup(form)
      localStorage.setItem('auth_token', token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-blue-50" />
      <nav className="px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">DW</div>
          <span className="font-semibold gradient-text">Digital Wallet</span>
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <Link to="/login" className="btn-ghost">Login</Link>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-2xl">
          <div className="card p-8">
            <h2 className="text-2xl font-semibold">Create your account</h2>
            <p className="mt-1 text-sm text-zinc-500">Start tracking expenses in minutes</p>
            <form onSubmit={submit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {error && <div className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
              <div className="sm:col-span-2 grid gap-1">
                <label className="text-xs font-medium text-zinc-600">Email</label>
                <input className="input" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-zinc-600">Username</label>
                <input className="input" placeholder="yourusername" value={form.username} onChange={e => update('username', e.target.value)} />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-zinc-600">Password</label>
                <input className="input" placeholder="••••••••" type="password" value={form.password} onChange={e => update('password', e.target.value)} />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-zinc-600">First name</label>
                <input className="input" placeholder="John" value={form.firstName} onChange={e => update('firstName', e.target.value)} />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-zinc-600">Last name</label>
                <input className="input" placeholder="Doe" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
              </div>
              <div className="sm:col-span-2 grid gap-1">
                <label className="text-xs font-medium text-zinc-600">Phone number</label>
                <input className="input" placeholder="+1 555 000 0000" value={form.phoneNumber} onChange={e => update('phoneNumber', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
              </div>
              <div className="sm:col-span-2 text-center text-xs text-zinc-500">Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link></div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
