import { useEffect, useState } from "react";
import { Budget, upsertBudget, getBudgetByMonthYear } from "../api/budgets";
import { useAuth } from "../context/AuthContext";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: Budget | null;
  onSuccess: (budget: Budget) => void;
}

export default function BudgetModal({ isOpen, onClose, currentBudget, onSuccess }: BudgetModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [budgetForm, setBudgetForm] = useState({
    amount: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const getCurrencySymbol = () => {
    try {
      if (user?.currency) {
        const parts = new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: user.currency,
          minimumFractionDigits: 0,
        }).formatToParts(0);
        const cur = parts.find((p) => p.type === "currency");
        return cur?.value ?? user.currency;
      }
    } catch {}
    return user?.currency ?? "";
  };

  useEffect(() => {
    if (!isOpen) return;
    // Prefill from currentBudget if available
    if (currentBudget) {
      setBudgetForm({
        amount: currentBudget.amount.toString(),
        year: currentBudget.year,
        month: currentBudget.month,
      });
    } else {
      // Load current month/year budget
      const d = new Date();
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      preloadBudget(y, m);
    }
    setError(undefined);
  }, [isOpen, currentBudget]);

  async function preloadBudget(year: number, month: number) {
    try {
      const budget = await getBudgetByMonthYear(year, month);
      setBudgetForm({
        amount: budget ? budget.amount.toString() : "0",
        year,
        month,
      });
    } catch (err) {
      setBudgetForm({ amount: "0", year, month });
    }
  }

  async function submitBudget(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      const budget = await upsertBudget({
        year: budgetForm.year,
        month: budgetForm.month,
        amount: parseFloat(budgetForm.amount),
      });
      onSuccess(budget);
      handleClose();
    } catch {
      setError("Failed to save budget");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setBudgetForm({ amount: "", year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
    setError(undefined);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300 overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl w-full max-w-4xl relative overflow-hidden transform transition-all duration-500 scale-100 opacity-100 my-8">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
        <button
          className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white/90 transition-all duration-200 hover:scale-105 shadow-sm"
          onClick={handleClose}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {error && (
          <div className="mx-8 mt-8 p-4 text-sm text-red-700 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="relative max-h-[80vh] overflow-y-auto">
          <form onSubmit={submitBudget} className="space-y-6">
            <div className="flex items-center gap-3 sticky top-0 bg-white/95 backdrop-blur-sm py-4 px-6 border-b border-gray-100/50 z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Set Monthly Budget</h2>
                <p className="text-sm text-gray-500">Plan your spending for the month</p>
              </div>
            </div>

            <div className="px-6 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Month
                  </label>
                  <select
                    required
                    value={budgetForm.month}
                    onChange={(e) => {
                      const newMonth = parseInt(e.target.value);
                      setBudgetForm((prev) => ({ ...prev, month: newMonth }));
                      preloadBudget(budgetForm.year, newMonth);
                    }}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2023, i, 1).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Year
                  </label>
                  <select
                    required
                    value={budgetForm.year}
                    onChange={(e) => {
                      const newYear = parseInt(e.target.value);
                      setBudgetForm((prev) => ({ ...prev, year: newYear }));
                      preloadBudget(newYear, budgetForm.month);
                    }}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200"
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <option key={i} value={new Date().getFullYear() + i - 2}>
                        {new Date().getFullYear() + i - 2}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Budget Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={budgetForm.amount}
                    onChange={(e) => setBudgetForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full pl-8 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200 hover:bg-white/80"
                  />
                </div>
                <p className="text-xs text-gray-500">Set your spending limit for this month</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100/50 sticky bottom-0 bg-white/95 backdrop-blur-sm px-6 pb-2 z-10 mt-6">
              <button
                type="button"
                className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 rounded-xl transition-all duration-200 font-medium"
                onClick={handleClose}
              >
                {currentBudget ? "Cancel" : "Skip for Now"}
              </button>
              <button
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
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
                ) : currentBudget ? (
                  "Update Budget"
                ) : (
                  "Set Budget"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
