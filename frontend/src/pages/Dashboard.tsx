import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Dashboard</h2>
          <p className="text-zinc-600 mt-1">Expenses list, budgets and alerts will appear here.</p>
          {user && (
            <div className="mt-2 text-sm text-zinc-700 font-medium">
              {`${user.firstName || ''} ${user.lastName || ''}`.trim()} ({user.username})
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button className="btn-primary">Add Expense</button>
          <button className="btn-secondary" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="card p-5">
          <div className="text-sm text-zinc-500">This Month</div>
          <div className="mt-2 text-3xl font-semibold">$0</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-zinc-500">Budget</div>
          <div className="mt-2 text-3xl font-semibold">$0</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-zinc-500">Remaining</div>
          <div className="mt-2 text-3xl font-semibold">$0</div>
        </div>
      </div>

      <div className="mt-8 card p-5">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-zinc-900">Recent Expenses</h3>
          <button className="btn-secondary">View all</button>
        </div>
        <div className="mt-4 text-sm text-zinc-600">No expenses yet.</div>
      </div>
    </div>
  )
}
