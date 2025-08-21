import { useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, refresh, logout } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('auth_token', token)
      navigate(location.pathname, { replace: true })
      refresh()
    }
  }, [location.search, location.pathname, navigate, refresh])

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-blue-50" />
      <nav className="px-6 py-4 flex items-center justify-between backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/50 border-b border-white/40">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">DW</div>
          <span className="font-semibold gradient-text hidden sm:inline">Digital Wallet</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-600 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />{user.firstName || user.username}</span>
          <button onClick={logout} className="btn-ghost">Logout</button>
        </div>
      </nav>
      <main className="flex-1 px-6 py-10 max-w-7xl w-full mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="card p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-60" />
            <div className="relative">
              <h3 className="text-sm font-medium text-zinc-600">Total Budget</h3>
              <p className="mt-2 text-2xl font-semibold tracking-tight">$0.00</p>
              <p className="mt-1 text-xs text-zinc-500">No budgets created</p>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-medium text-zinc-600">This Month Spend</h3>
            <p className="mt-2 text-2xl font-semibold tracking-tight">$0.00</p>
            <p className="mt-1 text-xs text-zinc-500">Create expenses to see insights</p>
          </div>
            <div className="card p-5">
            <h3 className="text-sm font-medium text-zinc-600">Categories</h3>
            <p className="mt-2 text-2xl font-semibold tracking-tight">0</p>
            <p className="mt-1 text-xs text-zinc-500">Organize your spending</p>
          </div>
        </div>
        <div className="mt-10 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Expenses</h2>
              <button className="btn-outline text-xs">Add</button>
            </div>
            <div className="text-sm text-zinc-500">No expenses yet.</div>
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-semibold">Upcoming</h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-600 list-disc list-inside">
              <li>Budget creation & tracking</li>
              <li>Category management</li>
              <li>Spending analytics</li>
              <li>Tagging & filtering</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
