import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listCategories, createCategory, Category } from "../api/categories";
import { listTags, createTag, Tag } from "../api/tags";
import { listRecentExpenses, deleteExpense, Expense } from "../api/expenses";
import {
  getCurrentBudget,
  upsertBudget,
  getBudgetByMonthYear,
  Budget,
} from "../api/budgets";
import Layout from "../components/Layout";
import ExpenseModal from "../components/ExpenseModal";
import CategoryModal from "../components/CategoryModal";
import TagModal from "../components/TagModal";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refresh, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [showExpense, setShowExpense] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [showTag, setShowTag] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    parentId: "",
    categoryType: "",
    subCategories: [""],
  });
  const [tagForm, setTagForm] = useState({ name: "" });
  const [budgetForm, setBudgetForm] = useState({
    amount: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1, // JavaScript months are 0-indexed
  });
  const [showAllSystemTags, setShowAllSystemTags] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [showAllCategories, setShowAllCategories] = useState(false);
  // Spend analysis specific UI state
  const [showSpendDetails, setShowSpendDetails] = useState(false);
  const spendDetailsRef = useRef<HTMLDivElement | null>(null);
  const [donutHover, setDonutHover] = useState<{
    label: string;
    amount: number;
    x: number;
    y: number;
  } | null>(null);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const nowRef = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(nowRef.getMonth()); // 0-indexed
  const [selectedYear, setSelectedYear] = useState<number>(
    nowRef.getFullYear()
  );

  // Outside click & Escape handling for Spend Details modal
  useEffect(() => {
    if (!showSpendDetails) return;
    const handler = (e: MouseEvent) => {
      if (
        spendDetailsRef.current &&
        !spendDetailsRef.current.contains(e.target as Node)
      ) {
        setShowSpendDetails(false);
        setDonutHover(null);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSpendDetails(false);
        setDonutHover(null);
      }
    };
    window.addEventListener("mousedown", handler);
    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("keydown", keyHandler);
    };
  }, [showSpendDetails]);

  // Currency formatting helpers (use user's currency if available)
  const formatCurrency = (amount: number) => {
    if (amount == null) return "";
    try {
      if (user?.currency) {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: user.currency,
        }).format(amount);
      }
    } catch {}
    // Fallback: show number without forcing a dollar sign so we don't incorrectly display '$' for non-USD users
    return amount.toFixed(2);
  };

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
    // If no symbol could be determined, prefer returning the currency code (if user has one) or empty string
    return user?.currency ?? "";
  };

  // Tag color palette (used for non-clickable tag pills)
  const tagColorClasses = [
    "bg-blue-50 text-blue-800 border border-blue-100",
    "bg-green-50 text-green-800 border border-green-100",
    "bg-purple-50 text-purple-800 border border-purple-100",
    "bg-amber-50 text-amber-800 border border-amber-100",
    "bg-red-50 text-red-800 border border-red-100",
    "bg-teal-50 text-teal-800 border border-teal-100",
    "bg-indigo-50 text-indigo-800 border border-indigo-100",
    "bg-pink-50 text-pink-800 border border-pink-100",
  ];

  const getTagClass = (tag: { id?: number; name?: string }) => {
    const idx = typeof tag.id === "number" ? tag.id : tag.name?.length ?? 0;
    return tagColorClasses[idx % tagColorClasses.length];
  };

  // Calculate current month's spending
  const getCurrentMonthSpending = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.transactionDate);
        return (
          expenseDate.getFullYear() === currentYear &&
          expenseDate.getMonth() === currentMonth
        );
      })
      .reduce((total, expense) => total + expense.amount, 0);
  };

  const currentMonthSpending = getCurrentMonthSpending();
  const spendingPercentage = currentBudget?.amount
    ? (currentMonthSpending / currentBudget.amount) * 100
    : 0;

  // Get the last 5 expenses sorted by transaction date (desc) then by amount (desc)
  const getRecentExpenses = () => {
    return expenses
      .sort((a, b) => {
        // First sort by transaction date (most recent first)
        const dateA = new Date(a.transactionDate).getTime();
        const dateB = new Date(b.transactionDate).getTime();
        if (dateB !== dateA) {
          return dateB - dateA;
        }
        // If dates are the same, sort by amount (highest first)
        return b.amount - a.amount;
      })
      .slice(0, 5);
  };

  const recentExpenses = getRecentExpenses();

  // Compute spending distribution per parent category for the current month
  const getCategoryDistribution = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthly = expenses.filter((expense) => {
      const expenseDate = new Date(expense.transactionDate);
      return (
        expenseDate.getFullYear() === currentYear &&
        expenseDate.getMonth() === currentMonth
      );
    });

    const totals = new Map<number, { name: string; total: number }>();
    for (const e of monthly) {
      let parentId = e.category?.parentId ?? e.category?.id;
      let parentName =
        e.category?.parentName ?? e.category?.name ?? "Uncategorized";
      if (parentId == null) {
        parentId = -1;
        parentName = "Uncategorized";
      }
      const existing = totals.get(parentId) ?? { name: parentName, total: 0 };
      existing.total += e.amount;
      totals.set(parentId, existing);
    }

    const list = Array.from(totals.entries()).map(([id, v]) => ({
      id,
      name: v.name,
      total: v.total,
    }));
    list.sort((a, b) => b.total - a.total);
    const totalSum = list.reduce((s, it) => s + it.total, 0);
    return { list, totalSum };
  };

  // Month-aware distribution for spend analysis card
  const getCategoryDistributionFor = (month: number, year: number) => {
    const monthly = expenses.filter((expense) => {
      const d = new Date(expense.transactionDate);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const totals = new Map<number, { name: string; total: number }>();
    for (const e of monthly) {
      let parentId = e.category?.parentId ?? e.category?.id;
      let parentName =
        e.category?.parentName ?? e.category?.name ?? "Uncategorized";
      if (parentId == null) {
        parentId = -1;
        parentName = "Uncategorized";
      }
      const existing = totals.get(parentId) ?? { name: parentName, total: 0 };
      existing.total += e.amount;
      totals.set(parentId, existing);
    }
    const list = Array.from(totals.entries()).map(([id, v]) => ({
      id,
      name: v.name,
      total: v.total,
    }));
    list.sort((a, b) => b.total - a.total);
    const totalSum = list.reduce((s, it) => s + it.total, 0);
    return { list, totalSum };
  };

  // SVG helpers for drawing pie arcs
  const polarToCartesian = (
    cx: number,
    cy: number,
    r: number,
    angle: number
  ) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${cx} ${cy} Z`;
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("auth_token", token);
      navigate(location.pathname, { replace: true });
      refresh();
    }
  }, [location.search, location.pathname, navigate, refresh]);

  useEffect(() => {
    if (user) {
      listCategories().then(setCategories);
      listTags().then(setTags);
      listRecentExpenses().then(setExpenses);

      // Load current month's budget and prompt user if not set
      getCurrentBudget()
        .then((budget) => {
          setCurrentBudget(budget);
          if (!budget) {
            // Show budget modal if no budget is set for current month
            setShowBudget(true);
          }
        })
        .catch((err) => {
          console.warn("Failed to load budget:", err);
          // Still show budget modal if there's an error
          setShowBudget(true);
        });
    }
  }, [user]);

  async function handleEditExpense(expense: Expense) {
    setEditingExpense(expense);
    setShowExpense(true);
  }

  function handleExpenseSuccess(expense: Expense, isEdit: boolean) {
    if (isEdit) {
      setExpenses((prev) =>
        prev.map((exp) => (exp.id === expense.id ? expense : exp))
      );
    } else {
      setExpenses((prev) => [expense, ...prev]);
    }
    setEditingExpense(null);
  }

  async function handleDeleteExpense(expenseId: number) {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    setLoading(true);
    setError(undefined);
    try {
      await deleteExpense(expenseId);
      setExpenses((prev) => prev.filter((exp) => exp.id !== expenseId));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete expense");
    } finally {
      setLoading(false);
    }
  }

  // moved to CategoryModal component

  // moved to TagModal component

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

      // Only update the displayed budget if user is setting budget for current month
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      if (
        budgetForm.year === currentYear &&
        budgetForm.month === currentMonth
      ) {
        setCurrentBudget(budget);
      }

      setShowBudget(false);
      setBudgetForm({
        amount: "",
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      });
    } catch {
      setError("Failed to save budget");
    } finally {
      setLoading(false);
    }
  }

  async function fetchBudgetForMonthYear(year: number, month: number) {
    try {
      const budget = await getBudgetByMonthYear(year, month);
      setBudgetForm((prev) => ({
        ...prev,
        amount: budget ? budget.amount.toString() : "0",
      }));
    } catch (err) {
      console.warn("Failed to fetch budget for selected month/year:", err);
      setBudgetForm((prev) => ({ ...prev, amount: "0" }));
    }
  }

  // Helper: format a Date or ISO string into 'YYYY-MM-DDTHH:MM' in user's local timezone
  function formatDateForInput(input?: string | Date) {
    const d = input ? new Date(input) : new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // Helpers to display dates & times strictly in the user's local timezone without accidental UTC shifts
  function formatLocalDate(value: string | Date | undefined) {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; // DD/MM/YYYY
  }

  function formatLocalTime(value: string | Date | undefined) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`; // 24h HH:MM
  }

  if (!user) return null;

  return (
    <Layout currentPage="dashboard">
      <div className="px-6 py-10 max-w-7xl w-full mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <div className="flex gap-2">
            <button
              className="btn-outline text-xs"
              onClick={() => setShowCategory(true)}
            >
              New Category
            </button>
            <button
              className="btn-outline text-xs"
              onClick={() => {
                setShowTag(true);
                setShowAllSystemTags(false);
              }}
            >
              New Tag
            </button>
            <button
              className="btn-primary text-xs"
              onClick={() => {
                setEditingExpense(null);
                setShowExpense(true);
              }}
            >
              Add Expense
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="card p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-60" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-600">
                  {new Date().toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  Budget
                </h3>
                <button
                  onClick={() => {
                    // Pre-fill form with current budget if it exists, otherwise load from API
                    if (currentBudget) {
                      setBudgetForm({
                        amount: currentBudget.amount.toString(),
                        year: currentBudget.year,
                        month: currentBudget.month,
                      });
                    } else {
                      // Load budget for current month/year from API
                      const currentDate = new Date();
                      const currentYear = currentDate.getFullYear();
                      const currentMonth = currentDate.getMonth() + 1;
                      fetchBudgetForMonthYear(currentYear, currentMonth);
                    }
                    setShowBudget(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  {currentBudget ? "Edit" : "Set Budget"}
                </button>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {currentBudget
                  ? formatCurrency(currentBudget.amount)
                  : formatCurrency(0)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {currentBudget
                  ? "Click Edit to modify"
                  : "Set your monthly budget to track spending"}
              </p>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-600">
                This Month Spend
              </h3>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentBudget && spendingPercentage > 100
                    ? "bg-red-100"
                    : currentBudget && spendingPercentage > 75
                    ? "bg-yellow-100"
                    : "bg-green-100"
                }`}
              >
                <svg
                  className={`w-4 h-4 ${
                    currentBudget && spendingPercentage > 100
                      ? "text-red-600"
                      : currentBudget && spendingPercentage > 75
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {formatCurrency(currentMonthSpending)}
            </p>
            {currentBudget ? (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Budget: {formatCurrency(currentBudget.amount)}</span>
                  <span
                    className={
                      spendingPercentage > 100 ? "text-red-600 font-medium" : ""
                    }
                  >
                    {spendingPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      spendingPercentage > 100
                        ? "bg-red-600"
                        : spendingPercentage > 90
                        ? "bg-red-500"
                        : spendingPercentage > 75
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(spendingPercentage, 100)}%` }}
                  ></div>
                </div>
                <p
                  className={`text-xs ${
                    currentMonthSpending > currentBudget.amount
                      ? "text-red-600 font-medium"
                      : "text-zinc-500"
                  }`}
                >
                  {currentMonthSpending <= currentBudget.amount
                    ? `${formatCurrency(
                        currentBudget.amount - currentMonthSpending
                      )} remaining`
                    : `${formatCurrency(
                        currentMonthSpending - currentBudget.amount
                      )} over budget`}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">
                Set budget to track progress
              </p>
            )}
          </div>
          {/* Spend Analysis Card (replaces Categories card) */}
          <div className="card p-5 flex flex-col justify-between">
            {(() => {
              const { list, totalSum } = getCategoryDistributionFor(
                selectedMonth,
                selectedYear
              );
              const top3 = list.slice(0, 3);
              const monthLabel = new Date(
                selectedYear,
                selectedMonth
              ).toLocaleString("default", { month: "long" });
              const colors = [
                "#F97316",
                "#EA580C",
                "#FB923C",
                "#FDBA74",
                "#C2410C",
                "#FFEDD5",
              ]; // warm orange palette
              let angleStart = 0;
              const size = 120;
              const cx = size / 2;
              const cy = size / 2;
              const r = size / 2;

              return (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-[11px] font-semibold tracking-wide text-zinc-500">
                        SPEND ANALYSIS*
                      </h3>
                      <p className="mt-1 text-2xl font-semibold tracking-tight">
                        {formatCurrency(totalSum)}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">Inflow</p>
                      {top3.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {top3.map((c, idx) => {
                            const pct =
                              totalSum > 0 ? (c.total / totalSum) * 100 : 0;
                            return (
                              <div
                                key={c.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    style={{
                                      background: colors[idx % colors.length],
                                    }}
                                    className="h-7 w-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                                  >
                                    {c.name.substring(0, 1).toUpperCase()}
                                  </span>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-zinc-700">
                                      {c.name}
                                    </span>
                                    <span className="text-[10px] text-zinc-400">
                                      {pct.toFixed(2)}%
                                    </span>
                                  </div>
                                </div>
                                <span className="text-zinc-700 font-medium">
                                  {formatCurrency(c.total)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      {/* Month selector */}
                      <div className="relative mb-2">
                        <button
                          onClick={() => setMonthDropdownOpen((o) => !o)}
                          className="px-4 py-1.5 rounded-full border border-zinc-200 bg-white text-xs font-medium flex items-center gap-1 shadow-sm hover:bg-zinc-50"
                        >
                          {selectedMonth === nowRef.getMonth() &&
                          selectedYear === nowRef.getFullYear()
                            ? "This Month"
                            : monthLabel}
                          <svg
                            className={`w-3 h-3 transition-transform ${
                              monthDropdownOpen ? "rotate-180" : ""
                            }`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        {monthDropdownOpen && (
                          <div className="absolute right-0 mt-2 w-44 bg-white border border-zinc-200 rounded-xl shadow-lg z-40 py-2 text-xs">
                            {[...Array(6)].map((_, i) => {
                              const date = new Date(
                                nowRef.getFullYear(),
                                nowRef.getMonth() - i,
                                1
                              );
                              const m = date.getMonth();
                              const y = date.getFullYear();
                              const label =
                                i === 0
                                  ? `This Month - ${date.toLocaleString(
                                      "default",
                                      { month: "long" }
                                    )}`
                                  : date.toLocaleString("default", {
                                      month: "long",
                                    });
                              return (
                                <button
                                  key={i}
                                  onClick={() => {
                                    setSelectedMonth(m);
                                    setSelectedYear(y);
                                    setMonthDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-1 hover:bg-zinc-100"
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {/* Donut chart */}
                      <div className="relative">
                        {(() => {
                          if (totalSum === 0)
                            return (
                              <div className="w-32 h-32 rounded-full bg-zinc-50 flex items-center justify-center text-[11px] text-zinc-400">
                                No data
                              </div>
                            );
                          const segments = list.slice(0, 6); // limit
                          angleStart = 0;
                          return (
                            <svg
                              width={size}
                              height={size}
                              viewBox={`0 0 ${size} ${size}`}
                            >
                              {segments.map((seg, idx) => {
                                const value = seg.total;
                                const angle = (value / totalSum) * 360;
                                const path = describeArc(
                                  cx,
                                  cy,
                                  r,
                                  angleStart,
                                  angleStart + angle
                                );
                                const color = colors[idx % colors.length];
                                angleStart += angle;
                                return (
                                  <path
                                    key={seg.id}
                                    d={path}
                                    fill={color}
                                    stroke="#fff"
                                    strokeWidth={1}
                                  />
                                );
                              })}
                              <circle
                                cx={cx}
                                cy={cy}
                                r={r * 0.55}
                                fill="#fff"
                              />
                              <text
                                x={cx}
                                y={cy - 2}
                                textAnchor="middle"
                                style={{
                                  fontSize: 13,
                                  fill: "#111827",
                                  fontWeight: 600,
                                }}
                              >
                                {formatCurrency(totalSum)}
                              </text>
                              <text
                                x={cx}
                                y={cy + 14}
                                textAnchor="middle"
                                style={{ fontSize: 10, fill: "#6B7280" }}
                              >
                                Total
                              </text>
                            </svg>
                          );
                        })()}
                      </div>
                      <button
                        onClick={() => setShowSpendDetails(true)}
                        className="mt-4 text-[11px] font-medium px-5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 shadow-sm"
                      >
                        SEE DETAILS
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    *Spend Analysis includes transactions across all your
                    categories
                  </p>
                </>
              );
            })()}
          </div>
        </div>
        <div className="mt-10">
          {(() => {
            const display = recentExpenses.slice(0, 5);
            const totalRecent = display.reduce(
              (s, x) => s + (x.amount || 0),
              0
            );
            const palette = [
              "bg-gradient-to-br from-indigo-500 to-indigo-600",
              "bg-gradient-to-br from-rose-500 to-pink-600",
              "bg-gradient-to-br from-emerald-500 to-teal-600",
              "bg-gradient-to-br from-amber-500 to-orange-600",
              "bg-gradient-to-br from-blue-500 to-cyan-600",
            ];
            return (
              <div className="relative rounded-3xl border border-zinc-200/70 bg-white/80 backdrop-blur-md shadow-xl overflow-hidden">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.08),transparent_60%),radial-gradient(circle_at_80%_40%,rgba(236,72,153,0.06),transparent_60%)]"></div>
                <div className="relative px-6 pt-6 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold tracking-wide flex items-center gap-2">
                      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white text-sm font-bold shadow">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8c-1.657 0-3 1.343-3 3m6 0a3 3 0 00-3-3m0 0V5m0 3a3 3 0 013 3m-3 0H9m3 0h3m5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </span>
                      Recent Expenses
                    </h2>
                    {display.length > 0 && (
                      <span className="text-[11px] px-2 py-1 rounded-lg bg-zinc-100 text-zinc-600 font-medium">
                        {display.length} items
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {display.length > 0 && (
                      <div className="text-[11px] font-semibold px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm">
                        {formatCurrency(totalRecent)}
                      </div>
                    )}
                    <Link
                      to="/expenses/filter"
                      className="text-xs px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 font-medium shadow-sm transition-colors"
                    >
                      Filter
                    </Link>
                    <button
                      className="text-xs px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium shadow-sm transition-colors"
                      onClick={() => {
                        setEditingExpense(null);
                        setShowExpense(true);
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                {display.length === 0 ? (
                  <div className="px-6 pb-8 text-sm text-zinc-500">
                    No expenses yet.
                  </div>
                ) : (
                  <ul className="relative divide-y divide-zinc-100/60">
                    {display.map((e, idx) => {
                      const avatarColor = palette[idx % palette.length];
                      return (
                        <li
                          key={e.id}
                          className="group relative px-6 py-4 flex items-start gap-4 hover:bg-zinc-50/70 transition-colors"
                        >
                          <div
                            className={`h-11 w-11 rounded-2xl flex items-center justify-center text-white text-sm font-semibold shadow-sm shrink-0 ${avatarColor}`}
                          >
                            {e.category?.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="font-semibold text-zinc-800 text-sm truncate max-w-[160px]"
                                    title={e.description || e.category?.name}
                                  >
                                    {formatCurrency(e.amount)}
                                  </span>
                                  {e.paymentType && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-500 font-medium">
                                      {e.paymentType.replace("-", " ")}
                                    </span>
                                  )}
                                </div>
                                <div
                                  className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]"
                                  title={e.description}
                                >
                                  {e.category?.name || "—"}
                                  {e.description ? ` · ${e.description}` : ""}
                                </div>
                                {e.tags && e.tags.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {e.tags.slice(0, 4).map((t, i) => (
                                      <span
                                        key={t.id ?? t.name}
                                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getTagClass(
                                          t
                                        )}`}
                                      >
                                        {t.name}
                                      </span>
                                    ))}
                                    {e.tags.length > 4 && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                                        +{e.tags.length - 4}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
                                  <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-200 shadow-sm flex items-center gap-1">
                                    <svg
                                      className="w-3 h-3 text-indigo-500"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    {formatLocalDate(e.transactionDate)}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-200 shadow-sm flex items-center gap-1">
                                    <svg
                                      className="w-3 h-3 text-pink-500"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    {formatLocalTime(e.transactionDate)}
                                  </span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1">
                                  <button
                                    onClick={() => handleEditExpense(e)}
                                    className="p-1.5 rounded-md bg-white/90 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 border border-zinc-200 shadow-sm"
                                    title="Edit expense"
                                    aria-label="Edit expense"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExpense(e.id)}
                                    className="p-1.5 rounded-md bg-white/90 hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-zinc-200 shadow-sm"
                                    title="Delete expense"
                                    aria-label="Delete expense"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="px-6 py-4 flex items-center justify-between border-t border-zinc-100 bg-gradient-to-r from-white to-zinc-50">
                  <span className="text-[11px] text-zinc-500">
                    Showing latest {Math.min(5, recentExpenses.length)} of{" "}
                    {recentExpenses.length} transactions
                  </span>
                  <Link
                    to="/expenses/filter"
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    View all &rarr;
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      <ExpenseModal
        isOpen={showExpense}
        onClose={() => {
          setShowExpense(false);
          setEditingExpense(null);
        }}
        categories={categories}
        tags={tags}
        editingExpense={editingExpense}
        onSuccess={handleExpenseSuccess}
      />
      {/* Reusable Modals */}
      <CategoryModal
        isOpen={showCategory}
        onClose={() => {
          setShowCategory(false);
          setCategoryForm({ name: "", parentId: "", categoryType: "", subCategories: [""] });
        }}
        categories={categories}
        onSuccess={(created) => {
          setCategories((prev) => [...prev, ...created]);
        }}
      />
      <TagModal
        isOpen={showTag}
        onClose={() => {
          setShowTag(false);
          setShowAllSystemTags(false);
        }}
        tags={tags}
        onSuccess={(created) => {
          setTags((prev) => [...prev, created]);
        }}
      />

      {(showBudget) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl w-full max-w-4xl relative overflow-hidden transform transition-all duration-500 scale-100 opacity-100 my-8">
            {/* Header gradient overlay */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>

            {/* Close button */}
            <button
              className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white/90 transition-all duration-200 hover:scale-105 shadow-sm"
              onClick={() => {
                setShowCategory(false);
                setShowTag(false);
                setShowBudget(false);
                setShowAllSystemTags(false);
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Error message */}
            {error && (
              <div className="mx-8 mt-8 p-4 text-sm text-red-700 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            )}

            <div className="relative max-h-[80vh] overflow-y-auto">
              {/* Category modal moved to CategoryModal component */}
                  {/* Title with icon */}
                  <div className="flex items-center gap-3 sticky top-0 bg-white/95 backdrop-blur-sm py-4 px-6 border-b border-gray-100/50 z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Create Category
                      </h2>
                      <p className="text-sm text-gray-500">
                        Organize your expenses with categories
                      </p>
                    </div>
                  </div>

                  <div className="px-6">
                    {/* Category Type Selection */}
                    <div className="space-y-3 mt-6">
                      <label className="text-sm font-semibold text-gray-700">
                        Category Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="relative">
                          <input
                            type="radio"
                            name="categoryType"
                            value="main"
                            checked={categoryForm.categoryType === "main"}
                            onChange={(e) =>
                              setCategoryForm((prev) => ({
                                ...prev,
                                categoryType: e.target.value,
                                parentId: "",
                                subCategories: [""],
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="p-4 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200 peer-checked:border-purple-500 peer-checked:bg-purple-50/50 hover:border-gray-300 hover:bg-gray-50/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center peer-checked:bg-purple-500 peer-checked:text-white">
                                <svg
                                  className="w-4 h-4 text-purple-600 peer-checked:text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2M7 7h10"
                                  />
                                </svg>
                              </div>
                              <div>
                                <div className="font-medium text-gray-800">
                                  Main Category
                                </div>
                                <div className="text-xs text-gray-500">
                                  Create with sub-categories
                                </div>
                              </div>
                            </div>
                          </div>
                        </label>
                        <label className="relative">
                          <input
                            type="radio"
                            name="categoryType"
                            value="sub"
                            checked={categoryForm.categoryType === "sub"}
                            onChange={(e) =>
                              setCategoryForm((prev) => ({
                                ...prev,
                                categoryType: e.target.value,
                                subCategories: [""],
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="p-4 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-50/50 hover:border-gray-300 hover:bg-gray-50/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center peer-checked:bg-blue-500 peer-checked:text-white">
                                <svg
                                  className="w-4 h-4 text-blue-600 peer-checked:text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <div className="font-medium text-gray-800">
                                  Sub-Category
                                </div>
                                <div className="text-xs text-gray-500">
                                  Add to existing category
                                </div>
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Parent Category Selection and Category Name in one row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Parent Category Selection (Sub-category only) */}
                      {categoryForm.categoryType === "sub" && (
                        <div className="space-y-2 transform transition-all duration-300">
                          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                              />
                            </svg>
                            Parent Category
                          </label>
                          <select
                            className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 hover:bg-white/80 appearance-none"
                            value={categoryForm.parentId}
                            onChange={(e) =>
                              setCategoryForm((prev) => ({
                                ...prev,
                                parentId: e.target.value,
                              }))
                            }
                            required
                          >
                            <option value="">Select a parent category</option>
                            {categories
                              .filter((c) => !c.parent)
                              .map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}

                      {/* Category Name */}
                      <div
                        className={`space-y-2 ${
                          categoryForm.categoryType === "sub"
                            ? ""
                            : "md:col-span-2"
                        }`}
                      >
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          {categoryForm.categoryType === "main"
                            ? "Main Category Name"
                            : "Category Name"}
                        </label>
                        <input
                          required
                          className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200 hover:bg-white/80"
                          value={categoryForm.name}
                          onChange={(e) =>
                            setCategoryForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder={
                            categoryForm.categoryType === "main"
                              ? "e.g. Transportation"
                              : "e.g. Public Transport"
                          }
                        />
                      </div>
                    </div>

                    {/* Sub-categories (Main category only) */}
                    {categoryForm.categoryType === "main" && (
                      <div className="space-y-3 transform transition-all duration-300">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Sub-Categories
                          <span className="text-xs text-gray-400 font-normal">
                            (optional)
                          </span>
                        </label>
                        <div className="space-y-3 p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {categoryForm.subCategories.map((subCat, index) => (
                              <div
                                key={index}
                                className="flex gap-2 items-center"
                              >
                                <input
                                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200 text-sm"
                                  value={subCat}
                                  onChange={(e) => {
                                    const updated = [
                                      ...categoryForm.subCategories,
                                    ];
                                    updated[index] = e.target.value;
                                    setCategoryForm((prev) => ({
                                      ...prev,
                                      subCategories: updated,
                                    }));
                                  }}
                                  placeholder={`Sub-category ${index + 1}`}
                                />
                                {categoryForm.subCategories.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated =
                                        categoryForm.subCategories.filter(
                                          (_, i) => i !== index
                                        );
                                      setCategoryForm((prev) => ({
                                        ...prev,
                                        subCategories: updated,
                                      }));
                                    }}
                                    className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 transition-all duration-200 flex items-center justify-center flex-shrink-0"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCategoryForm((prev) => ({
                                ...prev,
                                subCategories: [...prev.subCategories, ""],
                              }))
                            }
                            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors duration-200"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            Add another sub-category
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100/50 sticky bottom-0 bg-white/95 backdrop-blur-sm px-6 pb-2 z-10 mt-6">
                    <button
                      type="button"
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 rounded-xl transition-all duration-200 font-medium"
                      onClick={() => {
                        setShowCategory(false);
                        setCategoryForm({
                          name: "",
                          parentId: "",
                          categoryType: "",
                          subCategories: [""],
                        });
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      disabled={
                        loading ||
                        !categoryForm.categoryType ||
                        !categoryForm.name
                      }
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                      type="submit"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <svg
                            className="animate-spin w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Creating...
                        </div>
                      ) : (
                        "Create Category"
                      )}
                    </button>
                  </div>

              {/* Tag modal moved to TagModal component */}
                  {/* Title with icon */}
                  <div className="flex items-center gap-3 sticky top-0 bg-white/95 backdrop-blur-sm py-4 px-6 border-b border-gray-100/50 z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Create Tag
                      </h2>
                      <p className="text-sm text-gray-500">
                        Add labels to categorize your expenses
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-4">
                    {/* Tag Name */}
                    <div className="space-y-2 mt-6">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Tag Name
                      </label>
                      <input
                        required
                        className={`w-full px-4 py-3 bg-white/60 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 hover:bg-white/80 ${
                          tagForm.name &&
                          !!tags.find(
                            (t) =>
                              t.name.toLowerCase() ===
                              tagForm.name.toLowerCase()
                          )
                            ? "border-red-300 focus:ring-red-500/20 focus:border-red-400"
                            : "border-gray-200/50 focus:ring-pink-500/20 focus:border-pink-400"
                        }`}
                        value={tagForm.name}
                        onChange={(e) =>
                          setTagForm((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="e.g. Work, Personal, Urgent"
                      />
                      {tagForm.name &&
                        !!tags.find(
                          (t) =>
                            t.name.toLowerCase() === tagForm.name.toLowerCase()
                        ) && (
                          <div className="flex items-center gap-2 text-xs text-red-600">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                            This tag name already exists
                          </div>
                        )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Tags help you filter and organize expenses across
                        categories
                      </div>
                    </div>

                    {/* Existing Tags */}
                    {tags.length > 0 && (
                      <div className="space-y-3 mt-6">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          Existing Tags
                        </label>
                        <div
                          className={`p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-y-auto transition-all duration-300 ${
                            showAllSystemTags ? "max-h-48" : "max-h-32"
                          }`}
                        >
                          <div className="space-y-3">
                            {/* System Tags */}
                            {tags.filter((t) => t.isSystem).length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-emerald-700 mb-2">
                                  System Tags
                                </div>
                                <div className="flex flex-wrap gap-1.5 transition-all duration-300 ease-in-out">
                                  {(showAllSystemTags
                                    ? tags.filter((t) => t.isSystem)
                                    : tags
                                        .filter((t) => t.isSystem)
                                        .slice(0, 10)
                                  ).map((tag) => (
                                    <span
                                      key={tag.id}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-medium"
                                    >
                                      <svg
                                        className="w-2.5 h-2.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                        />
                                      </svg>
                                      {tag.name}
                                    </span>
                                  ))}
                                  {tags.filter((t) => t.isSystem).length >
                                    10 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowAllSystemTags(!showAllSystemTags)
                                      }
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors duration-200 font-medium"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d={
                                            showAllSystemTags
                                              ? "M5 15l7-7 7 7"
                                              : "M19 9l-7 7-7-7"
                                          }
                                        />
                                      </svg>
                                      {showAllSystemTags
                                        ? "Show Less"
                                        : `+${
                                            tags.filter((t) => t.isSystem)
                                              .length - 10
                                          } more`}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* User Tags */}
                            {tags.filter((t) => !t.isSystem).length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-blue-700 mb-2">
                                  Your Tags
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {tags
                                    .filter((t) => !t.isSystem)
                                    .map((tag) => (
                                      <span
                                        key={tag.id}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium"
                                      >
                                        <svg
                                          className="w-2.5 h-2.5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                          />
                                        </svg>
                                        {tag.name}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-amber-600">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          Make sure your new tag name doesn't duplicate existing
                          ones
                        </div>
                      </div>
                    )}

                    {/* Tag Preview */}
                    {tagForm.name && (
                      <div className="space-y-2 transform transition-all duration-300">
                        <label className="text-sm font-semibold text-gray-700">
                          Preview
                        </label>
                        <div className="p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-full text-sm font-medium shadow-lg shadow-pink-500/25">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
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
                      onClick={() => {
                        setShowTag(false);
                        setShowAllSystemTags(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      disabled={
                        loading ||
                        (tagForm.name &&
                          !!tags.find(
                            (t) =>
                              t.name.toLowerCase() ===
                              tagForm.name.toLowerCase()
                          ))
                      }
                      className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                      type="submit"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <svg
                            className="animate-spin w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Creating...
                        </div>
                      ) : (
                        "Create Tag"
                      )}
                    </button>
                  </div>

              {showBudget && (
                <form onSubmit={submitBudget} className="space-y-6">
                  {/* Title with icon */}
                  <div className="flex items-center gap-3 sticky top-0 bg-white/95 backdrop-blur-sm py-4 px-6 border-b border-gray-100/50 z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Set Monthly Budget
                      </h2>
                      <p className="text-sm text-gray-500">
                        Plan your spending for the month
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-4">
                    {/* Month and Year Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Month
                        </label>
                        <select
                          required
                          value={budgetForm.month}
                          onChange={(e) => {
                            const newMonth = parseInt(e.target.value);
                            setBudgetForm((prev) => ({
                              ...prev,
                              month: newMonth,
                            }));
                            fetchBudgetForMonthYear(budgetForm.year, newMonth);
                          }}
                          className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {new Date(2023, i, 1).toLocaleString("default", {
                                month: "long",
                              })}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Year
                        </label>
                        <select
                          required
                          value={budgetForm.year}
                          onChange={(e) => {
                            const newYear = parseInt(e.target.value);
                            setBudgetForm((prev) => ({
                              ...prev,
                              year: newYear,
                            }));
                            fetchBudgetForMonthYear(newYear, budgetForm.month);
                          }}
                          className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200"
                        >
                          {Array.from({ length: 5 }, (_, i) => (
                            <option
                              key={i}
                              value={new Date().getFullYear() + i - 2}
                            >
                              {new Date().getFullYear() + i - 2}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Budget Amount */}
                    <div className="space-y-2 mt-6">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
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
                          onChange={(e) =>
                            setBudgetForm((prev) => ({
                              ...prev,
                              amount: e.target.value,
                            }))
                          }
                          className="w-full pl-8 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200 hover:bg-white/80"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Set your spending limit for this month
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100/50 sticky bottom-0 bg-white/95 backdrop-blur-sm px-6 pb-2 z-10 mt-6">
                    <button
                      type="button"
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 rounded-xl transition-all duration-200 font-medium"
                      onClick={() => {
                        setShowBudget(false);
                        setBudgetForm({
                          amount: "",
                          year: new Date().getFullYear(),
                          month: new Date().getMonth() + 1,
                        });
                      }}
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
                          <svg
                            className="animate-spin w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
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
              )}
            </div>
          </div>
        </div>
      )}
      {showSpendDetails &&
        (() => {
          const { list, totalSum } = getCategoryDistributionFor(
            selectedMonth,
            selectedYear
          );
          const colors = [
            "#F97316",
            "#EA580C",
            "#FB923C",
            "#FDBA74",
            "#C2410C",
            "#FFEDD5",
            "#FED7AA",
          ];
          let angleStart = 0;
          const size = 260;
          const cx = size / 2;
          const cy = size / 2;
          const r = size / 2;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm overflow-y-auto">
              <div
                ref={spendDetailsRef}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl relative max-h-[90vh] overflow-auto p-6 md:p-10"
              >
                <button
                  onClick={() => setShowSpendDetails(false)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-600 flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <h2 className="text-xl font-semibold tracking-wide mb-8">
                  OUTFLOW CATEGORIES
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  <div className="space-y-6">
                    {list.length === 0 && (
                      <div className="text-sm text-zinc-500">
                        No spending data for this period.
                      </div>
                    )}
                    {list.map((c, idx) => {
                      const pct = totalSum > 0 ? (c.total / totalSum) * 100 : 0;
                      return (
                        <div
                          key={c.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              style={{
                                background: colors[idx % colors.length],
                              }}
                              className="h-12 w-12 rounded-xl flex items-center justify-center text-white text-sm font-semibold"
                            >
                              {c.name.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="flex flex-col justify-center leading-tight">
                              <span className="text-sm font-medium text-zinc-800 align-middle">
                                {c.name}
                              </span>
                              <span className="text-[11px] text-zinc-400">
                                {pct.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex items-center h-12">
                            <div className="text-sm font-medium text-zinc-800">
                              {formatCurrency(c.total)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center">
                    {totalSum === 0 ? (
                      <div className="w-64 h-64 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400">
                        No data
                      </div>
                    ) : (
                      <div
                        className="relative"
                        onMouseLeave={() => setDonutHover(null)}
                      >
                        <svg
                          width={size}
                          height={size}
                          viewBox={`0 0 ${size} ${size}`}
                        >
                          {list.map((seg, idx) => {
                            const value = seg.total;
                            const angle = (value / totalSum) * 360;
                            const path = describeArc(
                              cx,
                              cy,
                              r,
                              angleStart,
                              angleStart + angle
                            );
                            const color = colors[idx % colors.length];
                            angleStart += angle;
                            return (
                              <path
                                key={seg.id}
                                d={path}
                                fill={color}
                                stroke="#fff"
                                strokeWidth={1}
                                onMouseMove={(e) => {
                                  const rect = (
                                    e.currentTarget as SVGPathElement
                                  ).ownerSVGElement!.getBoundingClientRect();
                                  setDonutHover({
                                    label: seg.name,
                                    amount: seg.total,
                                    x: e.clientX - rect.left,
                                    y: e.clientY - rect.top,
                                  });
                                }}
                                onMouseEnter={(e) => {
                                  const rect = (
                                    e.currentTarget as SVGPathElement
                                  ).ownerSVGElement!.getBoundingClientRect();
                                  setDonutHover({
                                    label: seg.name,
                                    amount: seg.total,
                                    x: e.clientX - rect.left,
                                    y: e.clientY - rect.top,
                                  });
                                }}
                              />
                            );
                          })}
                          <circle cx={cx} cy={cy} r={r * 0.55} fill="#fff" />
                          <text
                            x={cx}
                            y={cy - 4}
                            textAnchor="middle"
                            style={{
                              fontSize: 24,
                              fill: "#111827",
                              fontWeight: 600,
                            }}
                          >
                            {formatCurrency(totalSum)}
                          </text>
                          <text
                            x={cx}
                            y={cy + 20}
                            textAnchor="middle"
                            style={{ fontSize: 14, fill: "#6B7280" }}
                          >
                            Total
                          </text>
                        </svg>
                        {donutHover &&
                          (() => {
                            const tooltipWidth = 140;
                            const tooltipHeight = 52; // approx height
                            let left = donutHover.x + 12;
                            let top = donutHover.y + 12;
                            if (left + tooltipWidth > size)
                              left = donutHover.x - tooltipWidth - 12;
                            if (left < 0) left = 0;
                            if (top + tooltipHeight > size)
                              top = donutHover.y - tooltipHeight - 12;
                            if (top < 0) top = 0;
                            return (
                              <div
                                className="pointer-events-none absolute px-3 py-1.5 rounded-lg bg-gray-900/90 text-white text-[11px] font-medium shadow-lg backdrop-blur-sm"
                                style={{ left, top, width: tooltipWidth }}
                              >
                                <div className="truncate">
                                  {donutHover.label}
                                </div>
                                <div className="text-[10px] opacity-80">
                                  {formatCurrency(donutHover.amount)}
                                </div>
                              </div>
                            );
                          })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </Layout>
  );
}
