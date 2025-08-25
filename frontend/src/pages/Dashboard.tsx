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
  const [expenseForm, setExpenseForm] = useState({ 
    amount: '', 
    description: '', 
    categoryId: '', 
    subCategoryId: '',
    tagIds: [] as number[], 
    paymentType: '',
    transactionDate: new Date().toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
  })
  const [categoryForm, setCategoryForm] = useState({ name: '', parentId: '', categoryType: '', subCategories: [''] })
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
        categoryId: expenseForm.subCategoryId ? Number(expenseForm.subCategoryId) : (expenseForm.categoryId ? Number(expenseForm.categoryId) : undefined),
        tagIds: expenseForm.tagIds.length ? expenseForm.tagIds : undefined,
        paymentType: expenseForm.paymentType || undefined,
        transactionDate: expenseForm.transactionDate ? new Date(expenseForm.transactionDate).toISOString() : undefined
      }
      const created = await createExpense(payload)
      setExpenses(prev => [created, ...prev])
      setShowExpense(false)
      setExpenseForm({ 
        amount: '', 
        description: '', 
        categoryId: '', 
        subCategoryId: '',
        tagIds: [], 
        paymentType: '',
        transactionDate: new Date().toISOString().slice(0, 16)
      })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create expense')
    } finally { setLoading(false) }
  }

  async function submitCategory(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(undefined)
    try {
      if (categoryForm.categoryType === 'main') {
        // Create main category first
        const mainCategory = await createCategory({ name: categoryForm.name })
        const newCategories = [mainCategory]
        
        // Create sub-categories
        for (const subName of categoryForm.subCategories) {
          if (subName.trim()) {
            const subCategory = await createCategory({ 
              name: subName.trim(), 
              parentId: mainCategory.id 
            })
            newCategories.push(subCategory)
          }
        }
        
        setCategories(prev => [...prev, ...newCategories])
      } else {
        // Create single sub-category
        const created = await createCategory({ 
          name: categoryForm.name, 
          parentId: categoryForm.parentId ? Number(categoryForm.parentId) : undefined 
        })
        setCategories(prev => [...prev, created])
      }
      
      setShowCategory(false)
      setCategoryForm({ name: '', parentId: '', categoryType: '', subCategories: [''] })
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
                    {e.paymentType && <span className="text-xs text-zinc-400">via {e.paymentType.replace('-', ' ')}</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400">{new Date(e.transactionDate).toLocaleDateString()}</span>
                    <br />
                    <span className="text-xs text-zinc-300">{new Date(e.transactionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl w-full max-w-4xl relative overflow-hidden transform transition-all duration-500 scale-100 opacity-100 my-8">
            {/* Header gradient overlay */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
            
            {/* Close button */}
            <button 
              className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white/90 transition-all duration-200 hover:scale-105 shadow-sm" 
              onClick={() => { setShowExpense(false); setShowCategory(false); setShowTag(false); }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Error message */}
            {error && (
              <div className="mx-8 mt-8 p-4 text-sm text-red-700 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            
            <div className="relative max-h-[80vh] overflow-y-auto">
              {showExpense && (
                <form onSubmit={submitExpense} className="space-y-6">
                  {/* Title with icon */}
                  <div className="flex items-center gap-3 sticky top-0 bg-white/95 backdrop-blur-sm py-4 px-6 border-b border-gray-100/50 z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Add New Expense</h2>
                      <p className="text-sm text-gray-500">Track your spending and categorize it</p>
                    </div>
                  </div>

                  <div className="px-6">
                    {/* Row 1: Amount and Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {/* Amount field */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Amount *
                      </label>
                      <div className="relative">
                        <input 
                          required 
                          type="number" 
                          step="0.01" 
                          className="w-full px-4 py-3 pl-8 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 hover:bg-white/80" 
                          value={expenseForm.amount} 
                          onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} 
                          placeholder="0.00"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      </div>
                    </div>

                    {/* Transaction Date field */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Date & Time
                      </label>
                      <input 
                        type="datetime-local"
                        className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 hover:bg-white/80" 
                        value={expenseForm.transactionDate} 
                        onChange={e => setExpenseForm(f => ({ ...f, transactionDate: e.target.value }))} 
                      />
                    </div>
                  </div>

                  {/* Row 2: Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Description
                    </label>
                    <input 
                      className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 hover:bg-white/80" 
                      value={expenseForm.description} 
                      onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} 
                      placeholder="What did you spend on?"
                    />
                  </div>

                  {/* Row 3: Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Main Category field */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Main Category *
                      </label>
                      <select 
                        required
                        className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 hover:bg-white/80 appearance-none" 
                        value={expenseForm.categoryId} 
                        onChange={e => {
                          setExpenseForm(f => ({ ...f, categoryId: e.target.value, subCategoryId: '' }))
                        }}
                      >
                        <option value="">Select main category</option>
                        {categories.filter(c => !c.parent).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sub-Category field */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Sub-Category
                        <span className="text-xs text-gray-400 font-normal">(optional)</span>
                      </label>
                      <select 
                        className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 hover:bg-white/80 appearance-none disabled:opacity-50 disabled:cursor-not-allowed" 
                        value={expenseForm.subCategoryId} 
                        onChange={e => setExpenseForm(f => ({ ...f, subCategoryId: e.target.value }))}
                        disabled={!expenseForm.categoryId}
                      >
                        <option value="">Select sub-category</option>
                        {expenseForm.categoryId && categories
                          .filter(c => c.parent?.id === Number(expenseForm.categoryId))
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                      </select>
                      {!expenseForm.categoryId && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Select a main category first
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 4: Payment Method */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'credit-card', label: 'Credit Card', icon: '💳' },
                        { value: 'debit-card', label: 'Debit Card', icon: '💳' },
                        { value: 'cash', label: 'Cash', icon: '💵' },
                        { value: 'online', label: 'Online', icon: '🌐' },
                        { value: 'bank-transfer', label: 'Bank Transfer', icon: '🏦' },
                        { value: 'others', label: 'Others', icon: '🔧' }
                      ].map(payment => (
                        <label key={payment.value} className="relative">
                          <input
                            type="radio"
                            name="paymentType"
                            value={payment.value}
                            checked={expenseForm.paymentType === payment.value}
                            onChange={(e) => setExpenseForm(prev => ({ ...prev, paymentType: e.target.value }))}
                            className="sr-only peer"
                          />
                          <div className="p-2 border-2 border-gray-200 rounded-lg cursor-pointer transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-50/50 hover:border-gray-300 hover:bg-gray-50/50 text-center">
                            <div className="text-sm mb-1">{payment.icon}</div>
                            <div className="text-xs font-medium text-gray-700">{payment.label}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Row 5: Tags */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50 min-h-[3rem]">
                      {tags.map(t => {
                        const active = expenseForm.tagIds.includes(t.id)
                        return (
                          <button 
                            type="button" 
                            key={t.id} 
                            onClick={() => toggleTag(t.id)} 
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${active 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                              : 'bg-white/80 border border-gray-200 text-gray-600 hover:bg-white hover:shadow-md'
                            }`}
                          >
                            {t.name}
                          </button>
                        )
                      })}
                      {tags.length === 0 && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          No tags created yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100/50 sticky bottom-0 bg-white/95 backdrop-blur-sm px-6 pb-2 z-10 mt-6">
                    <button 
                      type="button" 
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 rounded-xl transition-all duration-200 font-medium" 
                      onClick={() => setShowExpense(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={loading} 
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none" 
                      type="submit"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </div>
                      ) : 'Save Expense'}
                    </button>
                  </div>
                  </div>
                </form>
              )}
              
              {showCategory && (
                <form onSubmit={submitCategory} className="space-y-6">
                  {/* Title with icon */}
                  <div className="flex items-center gap-3 sticky top-0 bg-white/95 backdrop-blur-sm py-4 px-6 border-b border-gray-100/50 z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Create Category</h2>
                      <p className="text-sm text-gray-500">Organize your expenses with categories</p>
                    </div>
                  </div>

                  <div className="px-6">
                    {/* Category Type Selection */}
                    <div className="space-y-3 mt-6">
                    <label className="text-sm font-semibold text-gray-700">Category Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="relative">
                        <input
                          type="radio"
                          name="categoryType"
                          value="main"
                          checked={categoryForm.categoryType === 'main'}
                          onChange={(e) => setCategoryForm(prev => ({ 
                            ...prev, 
                            categoryType: e.target.value,
                            parentId: '',
                            subCategories: ['']
                          }))}
                          className="sr-only peer"
                        />
                        <div className="p-4 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200 peer-checked:border-purple-500 peer-checked:bg-purple-50/50 hover:border-gray-300 hover:bg-gray-50/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center peer-checked:bg-purple-500 peer-checked:text-white">
                              <svg className="w-4 h-4 text-purple-600 peer-checked:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">Main Category</div>
                              <div className="text-xs text-gray-500">Create with sub-categories</div>
                            </div>
                          </div>
                        </div>
                      </label>
                      <label className="relative">
                        <input
                          type="radio"
                          name="categoryType"
                          value="sub"
                          checked={categoryForm.categoryType === 'sub'}
                          onChange={(e) => setCategoryForm(prev => ({ 
                            ...prev, 
                            categoryType: e.target.value,
                            subCategories: ['']
                          }))}
                          className="sr-only peer"
                        />
                        <div className="p-4 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-50/50 hover:border-gray-300 hover:bg-gray-50/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center peer-checked:bg-blue-500 peer-checked:text-white">
                              <svg className="w-4 h-4 text-blue-600 peer-checked:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">Sub-Category</div>
                              <div className="text-xs text-gray-500">Add to existing category</div>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Parent Category Selection and Category Name in one row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Parent Category Selection (Sub-category only) */}
                    {categoryForm.categoryType === 'sub' && (
                      <div className="space-y-2 transform transition-all duration-300">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          </svg>
                          Parent Category
                        </label>
                        <select
                          className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 hover:bg-white/80 appearance-none"
                          value={categoryForm.parentId}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, parentId: e.target.value }))}
                          required
                        >
                          <option value="">Select a parent category</option>
                          {categories.filter(c => !c.parent).map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Category Name */}
                    <div className={`space-y-2 ${categoryForm.categoryType === 'sub' ? '' : 'md:col-span-2'}`}>
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {categoryForm.categoryType === 'main' ? 'Main Category Name' : 'Category Name'}
                      </label>
                      <input
                        required
                        className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200 hover:bg-white/80"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={categoryForm.categoryType === 'main' ? 'e.g. Transportation' : 'e.g. Public Transport'}
                      />
                    </div>
                  </div>

                  {/* Sub-categories (Main category only) */}
                  {categoryForm.categoryType === 'main' && (
                    <div className="space-y-3 transform transition-all duration-300">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Sub-Categories
                        <span className="text-xs text-gray-400 font-normal">(optional)</span>
                      </label>
                      <div className="space-y-3 p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {categoryForm.subCategories.map((subCat, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <input
                                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200 text-sm"
                                value={subCat}
                                onChange={(e) => {
                                  const updated = [...categoryForm.subCategories]
                                  updated[index] = e.target.value
                                  setCategoryForm(prev => ({ ...prev, subCategories: updated }))
                                }}
                                placeholder={`Sub-category ${index + 1}`}
                              />
                              {categoryForm.subCategories.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = categoryForm.subCategories.filter((_, i) => i !== index)
                                    setCategoryForm(prev => ({ ...prev, subCategories: updated }))
                                  }}
                                  className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 transition-all duration-200 flex items-center justify-center flex-shrink-0"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setCategoryForm(prev => ({ 
                            ...prev, 
                            subCategories: [...prev.subCategories, ''] 
                          }))}
                          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add another sub-category
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100/50 sticky bottom-0 bg-white/95 backdrop-blur-sm px-6 pb-2 z-10 mt-6">
                    <button 
                      type="button" 
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 rounded-xl transition-all duration-200 font-medium" 
                      onClick={() => {
                        setShowCategory(false)
                        setCategoryForm({ name: '', parentId: '', categoryType: '', subCategories: [''] })
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={loading || !categoryForm.categoryType || !categoryForm.name} 
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none" 
                      type="submit"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </div>
                      ) : 'Create Category'}
                    </button>
                  </div>
                  </div>
                </form>
              )}
              
              {showTag && (
                <form onSubmit={submitTag} className="space-y-6">
                  {/* Title with icon */}
                  <div className="flex items-center gap-3 sticky top-0 bg-white/95 backdrop-blur-sm py-4 -mx-6 px-6 border-b border-gray-100/50 z-10 -mt-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Create Tag</h2>
                      <p className="text-sm text-gray-500">Add labels to categorize your expenses</p>
                    </div>
                  </div>

                  <div className="px-6">
                  {/* Tag Name */}
                  <div className="space-y-2 mt-6">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Tag Name
                    </label>
                    <input 
                      required 
                      className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 transition-all duration-200 hover:bg-white/80" 
                      value={tagForm.name} 
                      onChange={e => setTagForm(f => ({ ...f, name: e.target.value }))} 
                      placeholder="e.g. Work, Personal, Urgent"
                    />
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Tags help you filter and organize expenses across categories
                    </div>
                  </div>

                  {/* Tag Preview */}
                  {tagForm.name && (
                    <div className="space-y-2 transform transition-all duration-300">
                      <label className="text-sm font-semibold text-gray-700">Preview</label>
                      <div className="p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-full text-sm font-medium shadow-lg shadow-pink-500/25">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {tagForm.name}
                        </div>
                      </div>
                    </div>
                  )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100/50 sticky bottom-0 bg-white/95 backdrop-blur-sm px-6 pb-2 z-10 mt-6">
                    <button 
                      type="button" 
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 rounded-xl transition-all duration-200 font-medium" 
                      onClick={() => setShowTag(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={loading} 
                      className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none" 
                      type="submit"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </div>
                      ) : 'Create Tag'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
