import { Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { user } = useAuth()

  const formatCurrency = (amount: number) => {
    if (amount == null) return ''
    try {
      if (user?.currency) {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: user.currency }).format(amount)
      }
    } catch {}
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 backdrop-blur surface border-b border-zinc-200/60">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">DW</div>
          <h1 className="text-xl md:text-2xl font-semibold gradient-text">Digital Wallet</h1>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <Link className="btn-ghost" to="/login">Login</Link>
          <Link className="btn-ghost" to="/signup">Sign up</Link>
          <Link className="btn-primary" to="/dashboard">Dashboard</Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Manage your <span className="gradient-text">money flow</span> with clarity
            </h2>
            <p className="mt-6 text-lg text-zinc-600 max-w-prose">Budgets, expenses, categories & insights in a clean interface. Built for speed and simplicity.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/signup" className="btn-primary">Get Started</Link>
              <Link to="/dashboard" className="btn-secondary">Live Demo</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-4 text-xs text-zinc-500">
              <span className="pill">Secure</span>
              <span className="pill">JWT Auth</span>
              <span className="pill">Google OAuth</span>
              <span className="pill">Responsive UI</span>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-100 via-indigo-100 to-white rounded-3xl blur-2xl opacity-70" />
            <div className="aspect-[16/11] w-full rounded-3xl border border-zinc-200/60 surface shadow-xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <div className="h-2 w-2 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div className="col-span-2 card p-4 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-medium text-zinc-500">Spending - This Month</div>
                    <div className="mt-3 text-3xl font-semibold">{formatCurrency(1240)}</div>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-zinc-200 overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-blue-600 to-indigo-600" />
                  </div>
                </div>
                <div className="card p-4 flex flex-col justify-between">
                  <div className="text-xs font-medium text-zinc-500">Budget</div>
                  <div className="text-2xl font-semibold">{formatCurrency(2000)}</div>
                </div>
                <div className="card p-4 col-span-3">
                  <div className="text-xs font-medium text-zinc-500 mb-2">Recent Categories</div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {['Food','Travel','Bills','Health','Other'].map(c => <span key={c} className="pill">{c}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="px-6 py-10 text-center text-xs text-zinc-500">© {new Date().getFullYear()} Digital Wallet. All rights reserved.</footer>
    </div>
  )
}
