import { useState } from 'react'

export default function Signup() {
  const [form, setForm] = useState({ email: '', username: '', password: '', firstName: '', lastName: '', phoneNumber: '' })
  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`Signup ${form.username}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold text-zinc-900">Sign up</h2>
      <form onSubmit={submit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
          <input className="input" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Username</label>
          <input className="input" placeholder="yourusername" value={form.username} onChange={e => update('username', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
          <input className="input" placeholder="********" type="password" value={form.password} onChange={e => update('password', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">First name</label>
          <input className="input" placeholder="John" value={form.firstName} onChange={e => update('firstName', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Last name</label>
          <input className="input" placeholder="Doe" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 mb-1">Phone number</label>
          <input className="input" placeholder="+1 555 000 0000" value={form.phoneNumber} onChange={e => update('phoneNumber', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary w-full">Create account</button>
        </div>
      </form>
    </div>
  )
}
