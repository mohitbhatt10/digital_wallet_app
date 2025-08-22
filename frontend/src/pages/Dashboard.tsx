import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listCategories, createCategory, Category } from '../api/categories'
import { listTags, createTag, Tag } from '../api/tags'
import { listRecentExpenses, createExpense, Expense } from '../api/expenses'

export default function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, refresh, logout } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showExpense, setShowExpense] = useState(false)
  const [showCategory, setShowCategory] = useState(false)
  const [showTag, setShowTag] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ amount: '', description: '', categoryId: '', tagIds: [] as number[] })
  const [categoryForm, setCategoryForm] = useState({ name: '', parentId: '' })
  const [tagForm, setTagForm] = useState({ name: '' })
  const [error, setError] = useState<string|undefined>()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('auth_token', token)
      navigate(location.pathname, { replace: true })
      refresh()
    }
  }, [location.search, location.pathname, navigate, refresh])

  useEffect(() => {
    if (user) {
      listCategories().then(setCategories)
      listTags().then(setTags)
      listRecentExpenses().then(setExpenses)
    }
  }, [user])

  function toggleTag(id: number) {
    setExpenseForm(f => ({ ...f, tagIds: f.tagIds.includes(id) ? f.tagIds.filter(t => t !== id) : [...f.tagIds, id] }))
  }

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(undefined)
    try {
      const payload = {
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description || undefined,
        categoryId: expenseForm.categoryId ? Number(expenseForm.categoryId) : undefined,
        tagIds: expenseForm.tagIds.length ? expenseForm.tagIds : undefined
      }
      const created = await createExpense(payload)
      setExpenses(prev => [created, ...prev])
      setShowExpense(false)
      setExpenseForm({ amount: '', description: '', categoryId: '', tagIds: [] })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create expense')
    } finally { setLoading(false) }
  }

  async function submitCategory(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(undefined)
    try {
      const created = await createCategory({ 
        name: categoryForm.name, 
        parentId: categoryForm.parentId ? Number(categoryForm.parentId) : undefined 
      })
      setCategories(prev => [...prev, created])
      setShowCategory(false)
      setCategoryForm({ name: '', parentId: '' })
    } catch { setError('Failed to create category') } finally { setLoading(false) }
  }

  async function submitTag(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(undefined)
    try {
      const created = await createTag({ name: tagForm.name })
      setTags(prev => [...prev, created])
      setShowTag(false)
      setTagForm({ name: '' })
    } catch { setError('Failed to create tag') } finally { setLoading(false) }
  }

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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <div className="flex gap-2">
            <button className="btn-outline text-xs" onClick={() => setShowCategory(true)}>New Category</button>
            <button className="btn-outline text-xs" onClick={() => setShowTag(true)}>New Tag</button>
            <button className="btn-primary text-xs" onClick={() => setShowExpense(true)}>Add Expense</button>
          </div>
        </div>
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
              <button className="btn-outline text-xs" onClick={() => setShowExpense(true)}>Add</button>
            </div>
            {expenses.length === 0 && <div className="text-sm text-zinc-500">No expenses yet.</div>}
            <ul className="space-y-3">
              {expenses.map(e => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-800">${e.amount.toFixed(2)}</span>
                    <span className="text-zinc-500">{e.category?.name || '—'} {e.tags && e.tags.length > 0 && <span className="text-xs">[{e.tags.map(t => t.name).join(', ')}]</span>}</span>
                  </div>
                  <span className="text-xs text-zinc-400">{new Date(e.date).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
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
      {(showExpense || showCategory || showTag) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 relative">
            <button className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600" onClick={() => { setShowExpense(false); setShowCategory(false); setShowTag(false); }}>✕</button>
            {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
            {showExpense && (
              <form onSubmit={submitExpense} className="space-y-5">
                <h2 className="text-lg font-semibold">Add Expense</h2>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-zinc-600">Amount</label>
                  <input required type="number" step="0.01" className="input" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-zinc-600">Description</label>
                  <input className="input" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-zinc-600">Category</label>
                  <select className="input" value={expenseForm.categoryId} onChange={e => setExpenseForm(f => ({ ...f, categoryId: e.target.value }))}>
                    <option value="">None</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.parent ? `${c.parent.name} > ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-zinc-600">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(t => {
                      const active = expenseForm.tagIds.includes(t.id)
                      return <button type="button" key={t.id} onClick={() => toggleTag(t.id)} className={`px-3 py-1 rounded-full text-xs border ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-100'}`}>{t.name}</button>
                    })}
                    {tags.length === 0 && <span className="text-xs text-zinc-400">No tags yet</span>}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="btn-ghost" onClick={() => setShowExpense(false)}>Cancel</button>
                  <button disabled={loading} className="btn-primary" type="submit">{loading ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            )}
            {showCategory && (
              <form onSubmit={submitCategory} className="space-y-5">
                <h2 className="text-lg font-semibold">New Category</h2>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-zinc-600">Name</label>
                  <input required className="input" value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-zinc-600">Parent Category (optional)</label>
                  <select className="input" value={categoryForm.parentId} onChange={e => setCategoryForm(f => ({ ...f, parentId: e.target.value }))}>
                    <option value="">None (Main Category)</option>
                    {categories.filter(c => !c.parent).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="btn-ghost" onClick={() => setShowCategory(false)}>Cancel</button>
                  <button disabled={loading} className="btn-primary" type="submit">{loading ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            )}
            {showTag && (
              <form onSubmit={submitTag} className="space-y-5">
                <h2 className="text-lg font-semibold">New Tag</h2>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-zinc-600">Name</label>
                  <input required className="input" value={tagForm.name} onChange={e => setTagForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="btn-ghost" onClick={() => setShowTag(false)}>Cancel</button>
                  <button disabled={loading} className="btn-primary" type="submit">{loading ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
