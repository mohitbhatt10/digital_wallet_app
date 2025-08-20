import { useState } from 'react'

export default function Login() {
  const [usernameOrEmail, setU] = useState('')
  const [password, setP] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`Login ${usernameOrEmail}`)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold text-zinc-900">Login</h2>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Email or Username</label>
          <input className="input" placeholder="you@example.com" value={usernameOrEmail} onChange={e => setU(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
          <input className="input" placeholder="********" type="password" value={password} onChange={e => setP(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary">Login</button>
      </form>
      <div className="mt-4">
        <button className="btn-secondary w-full" onClick={() => alert('OAuth2 Google flow TBD')}>Login with Google</button>
      </div>
    </div>
  )
}
