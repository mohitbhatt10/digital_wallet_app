export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Dashboard</h2>
          <p className="text-zinc-600 mt-1">Expenses list, budgets and alerts will appear here.</p>
        </div>
        <button className="btn-primary">Add Expense</button>
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
