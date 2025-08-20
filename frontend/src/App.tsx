import { Link } from 'react-router-dom'

export default function App() {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">Digital Wallet</h1>
        <nav className="flex items-center gap-4 text-sm">
          <Link className="text-zinc-700 hover:text-blue-700" to="/login">Login</Link>
          <Link className="text-zinc-700 hover:text-blue-700" to="/signup">Sign up</Link>
          <Link className="text-zinc-700 hover:text-blue-700" to="/dashboard">Dashboard</Link>
        </nav>
      </header>
      <main>
        <section className="mt-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">Track expenses, budgets and more</h2>
            <p className="mt-4 text-zinc-600">Responsive, modern UI starter built with React Router and Tailwind CSS.</p>
            <div className="mt-6 flex gap-3">
              <Link to="/signup" className="btn-primary">Get Started</Link>
              <Link to="/dashboard" className="btn-secondary">View Dashboard</Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="aspect-video rounded-xl bg-gradient-to-br from-blue-200 to-blue-400"></div>
          </div>
        </section>
      </main>
    </div>
  )
}
