import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listCategories, createCategory, Category } from "../api/categories";
import { listTags, createTag, Tag } from "../api/tags";
import {
  listRecentExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  Expense,
} from "../api/expenses";
import {
  getCurrentBudget,
  upsertBudget,
  getBudgetByMonthYear,
  Budget,
} from "../api/budgets";

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
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    description: "",
    categoryId: "",
    subCategoryId: "",
    tagIds: [] as number[],
    paymentType: "",
    transactionDate: formatDateForInput(), // Format: YYYY-MM-DDTHH:MM in local timezone
  });
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
  const [showAllExpenseSystemTags, setShowAllExpenseSystemTags] =
    useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [error, setError] = useState<string | undefined>();

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

  function toggleTag(id: number) {
    setExpenseForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(id)
        ? f.tagIds.filter((t) => t !== id)
        : [...f.tagIds, id],
    }));
  }

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      const payload = {
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description || undefined,
        categoryId: expenseForm.subCategoryId
          ? Number(expenseForm.subCategoryId)
          : expenseForm.categoryId
          ? Number(expenseForm.categoryId)
          : undefined,
        tagIds: expenseForm.tagIds.length ? expenseForm.tagIds : undefined,
        paymentType: expenseForm.paymentType || undefined,
        transactionDate: expenseForm.transactionDate
          ? new Date(expenseForm.transactionDate).toISOString()
          : undefined,
      };

      if (editingExpense) {
        // Update existing expense
        const updated = await updateExpense(editingExpense.id, payload);
        setExpenses((prev) =>
          prev.map((exp) => (exp.id === updated.id ? updated : exp))
        );
        setEditingExpense(null);
      } else {
        // Create new expense
        const created = await createExpense(payload);
        setExpenses((prev) => [created, ...prev]);
      }

      setShowExpense(false);
      setShowAllExpenseSystemTags(false);
      setExpenseForm({
        amount: "",
        description: "",
        categoryId: "",
        subCategoryId: "",
        tagIds: [],
        paymentType: "",
        transactionDate: formatDateForInput(),
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          `Failed to ${editingExpense ? "update" : "create"} expense`
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEditExpense(expense: Expense) {
    setEditingExpense(expense);

    // Determine if the category is a main category or subcategory using parent information
    let categoryId = "";
    let subCategoryId = "";

    if (expense.category) {
      if (expense.category.parentId) {
        // It's a subcategory - set parent as main category and this as subcategory
        categoryId = expense.category.parentId.toString();
        subCategoryId = expense.category.id.toString();
      } else {
        // It's a main category
        categoryId = expense.category.id.toString();
        subCategoryId = "";
      }
    }

    setExpenseForm({
      amount: expense.amount.toString(),
      description: expense.description || "",
      categoryId: categoryId,
      subCategoryId: subCategoryId,
      tagIds: expense.tags?.map((tag) => tag.id) || [],
      paymentType: expense.paymentType || "",
      transactionDate: expense.transactionDate
        ? formatDateForInput(expense.transactionDate)
        : formatDateForInput(),
    });
    setShowExpense(true);
    setShowAllExpenseSystemTags(false);
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

  async function submitCategory(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      if (categoryForm.categoryType === "main") {
        // Create main category first
        const mainCategory = await createCategory({ name: categoryForm.name });
        const newCategories = [mainCategory];

        // Create sub-categories
        for (const subName of categoryForm.subCategories) {
          if (subName.trim()) {
            const subCategory = await createCategory({
              name: subName.trim(),
              parentId: mainCategory.id,
            });
            newCategories.push(subCategory);
          }
        }

        setCategories((prev) => [...prev, ...newCategories]);
      } else {
        // Create single sub-category
        const created = await createCategory({
          name: categoryForm.name,
          parentId: categoryForm.parentId
            ? Number(categoryForm.parentId)
            : undefined,
        });
        setCategories((prev) => [...prev, created]);
      }

      setShowCategory(false);
      setCategoryForm({
        name: "",
        parentId: "",
        categoryType: "",
        subCategories: [""],
      });
    } catch {
      setError("Failed to create category");
    } finally {
      setLoading(false);
    }
  }

  async function submitTag(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      // Check for duplicate tag names (case-insensitive)
      const existingTag = tags.find(
        (t) => t.name.toLowerCase() === tagForm.name.toLowerCase()
      );
      if (existingTag) {
        setError(`Tag "${tagForm.name}" already exists`);
        setLoading(false);
        return;
      }

      const created = await createTag({ name: tagForm.name });
      setTags((prev) => [...prev, created]);
      setShowTag(false);
      setTagForm({ name: "" });
      setShowAllSystemTags(false);
    } catch {
      setError("Failed to create tag");
    } finally {
      setLoading(false);
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

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-blue-50" />
      <nav className="px-6 py-4 flex items-center justify-between backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/50 border-b border-white/40">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            DW
          </div>
          <span className="font-semibold gradient-text hidden sm:inline">
            Digital Wallet
          </span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-600 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {user.firstName || user.username}
          </span>
          <button onClick={logout} className="btn-ghost">
            Logout
          </button>
        </div>
      </nav>
      <main className="flex-1 px-6 py-10 max-w-7xl w-full mx-auto">
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
                setShowExpense(true);
                setShowAllExpenseSystemTags(false);
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
          <div className="card p-5">
            <h3 className="text-sm font-medium text-zinc-600">Categories</h3>
            <div className="mt-4">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  {(() => {
                    const { list, totalSum } = getCategoryDistribution();
                    const size = 120;
                    const cx = size / 2;
                    const cy = size / 2;
                    const r = size / 2;
                    let angleStart = 0;
                    const colors = [
                      "#6366F1",
                      "#EF4444",
                      "#10B981",
                      "#F59E0B",
                      "#8B5CF6",
                      "#06B6D4",
                      "#EC4899",
                      "#3B82F6",
                    ];

                    if (list.length === 0 || totalSum === 0) {
                      return (
                        <div className="w-28 h-28 bg-gray-50 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-400">No data</span>
                        </div>
                      );
                    }

                    return (
                      <svg
                        width={size}
                        height={size}
                        viewBox={`0 0 ${size} ${size}`}
                      >
                        {list.map((item, idx) => {
                          const value = item.total;
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
                              key={item.id}
                              d={path}
                              fill={color}
                              stroke="#fff"
                              strokeWidth={0.5}
                            />
                          );
                        })}
                        <circle cx={cx} cy={cy} r={r * 0.45} fill="#fff" />
                        <text
                          x={cx}
                          y={cy - 4}
                          textAnchor="middle"
                          style={{ fontSize: 12, fill: "#374151" }}
                        >
                          {formatCurrency(totalSum)}
                        </text>
                        <text
                          x={cx}
                          y={cy + 12}
                          textAnchor="middle"
                          style={{ fontSize: 10, fill: "#6B7280" }}
                        >
                          This month
                        </text>
                      </svg>
                    );
                  })()}
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-1 gap-2">
                    {(() => {
                      const { list, totalSum } = getCategoryDistribution();
                      const colors = [
                        "#6366F1",
                        "#EF4444",
                        "#10B981",
                        "#F59E0B",
                        "#8B5CF6",
                        "#06B6D4",
                        "#EC4899",
                        "#3B82F6",
                      ];
                      if (list.length === 0)
                        return (
                          <div className="text-sm text-gray-500">
                            No spending in this month
                          </div>
                        );
                      return list.map((it, idx) => {
                        const pct =
                          totalSum > 0 ? (it.total / totalSum) * 100 : 0;
                        return (
                          <div
                            key={it.id}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                style={{
                                  backgroundColor: colors[idx % colors.length],
                                }}
                                className="w-3 h-3 inline-block rounded-sm"
                              />
                              <span className="text-sm text-gray-700">
                                {it.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(it.total)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {pct.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Expenses</h2>
              <button
                className="btn-outline text-xs"
                onClick={() => {
                  setEditingExpense(null);
                  setExpenseForm({
                    amount: "",
                    description: "",
                    categoryId: "",
                    subCategoryId: "",
                    tagIds: [],
                    paymentType: "",
                    transactionDate: formatDateForInput(),
                  });
                  setShowExpense(true);
                  setShowAllExpenseSystemTags(false);
                }}
              >
                Add
              </button>
            </div>
            {recentExpenses.length === 0 && (
              <div className="text-sm text-zinc-500">No expenses yet.</div>
            )}
            <ul className="space-y-3">
              {recentExpenses.map((e, idx) => (
                <li
                  key={e.id}
                  className={`flex items-center justify-between text-sm group rounded-lg p-2 -mx-2 transition-colors duration-200 ${
                    idx % 2 === 0 ? "bg-gray-100" : "bg-gray-200"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-800">
                      {formatCurrency(e.amount)}
                    </span>
                    <span className="text-zinc-500">
                      {e.category?.name || "—"}
                    </span>

                    {/* Tag pills on next line */}
                    {e.tags && e.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {e.tags.map((t) => (
                          <span
                            key={t.id ?? t.name}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTagClass(
                              t
                            )}`}
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {e.paymentType && (
                      <span className="text-xs text-zinc-400 mt-1">
                        via {e.paymentType.replace("-", " ")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-zinc-400">
                        {new Date(e.transactionDate).toLocaleDateString()}
                      </span>
                      <br />
                      <span className="text-xs text-zinc-300">
                        {new Date(e.transactionDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEditExpense(e)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-200"
                        title="Edit expense"
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
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200"
                        title="Delete expense"
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
      {(showExpense || showCategory || showTag || showBudget) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl w-full max-w-4xl relative overflow-hidden transform transition-all duration-500 scale-100 opacity-100 my-8">
            {/* Header gradient overlay */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>

            {/* Close button */}
            <button
              className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white/90 transition-all duration-200 hover:scale-105 shadow-sm"
              onClick={() => {
                setShowExpense(false);
                setShowCategory(false);
                setShowTag(false);
                setShowBudget(false);
                setShowAllSystemTags(false);
                setShowAllExpenseSystemTags(false);
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
              {showExpense && (
                <form onSubmit={submitExpense} className="space-y-6">
                  {/* Title with icon */}
                  <div className="flex items-center gap-3 sticky top-0 bg-white/95 backdrop-blur-sm py-4 px-6 border-b border-gray-100/50 z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
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
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {editingExpense ? "Edit Expense" : "Add New Expense"}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Track your spending and categorize it
                      </p>
                    </div>
                  </div>

                  <div className="px-6">
                    {/* Row 1: Amount and Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      {/* Amount field */}
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
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
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
                            onChange={(e) =>
                              setExpenseForm((f) => ({
                                ...f,
                                amount: e.target.value,
                              }))
                            }
                            placeholder={formatCurrency(0)}
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            {getCurrencySymbol()}
                          </span>
                        </div>
                      </div>

                      {/* Transaction Date field */}
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
                          Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 hover:bg-white/80"
                          value={expenseForm.transactionDate}
                          onChange={(e) =>
                            setExpenseForm((f) => ({
                              ...f,
                              transactionDate: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    {/* Row 2: Description */}
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Description
                      </label>
                      <input
                        className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 hover:bg-white/80"
                        value={expenseForm.description}
                        onChange={(e) =>
                          setExpenseForm((f) => ({
                            ...f,
                            description: e.target.value,
                          }))
                        }
                        placeholder="What did you spend on?"
                      />
                    </div>

                    {/* Row 3: Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Main Category field */}
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
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2M7 7h10"
                            />
                          </svg>
                          Main Category *
                        </label>
                        <select
                          required
                          className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 hover:bg-white/80 appearance-none"
                          value={expenseForm.categoryId}
                          onChange={(e) => {
                            setExpenseForm((f) => ({
                              ...f,
                              categoryId: e.target.value,
                              subCategoryId: "",
                            }));
                          }}
                        >
                          <option value="">Select main category</option>
                          {categories
                            .filter((c) => !c.parent)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Sub-Category field */}
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
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          Sub-Category
                          <span className="text-xs text-gray-400 font-normal">
                            (optional)
                          </span>
                        </label>
                        <select
                          className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 hover:bg-white/80 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                          value={expenseForm.subCategoryId}
                          onChange={(e) =>
                            setExpenseForm((f) => ({
                              ...f,
                              subCategoryId: e.target.value,
                            }))
                          }
                          disabled={!expenseForm.categoryId}
                        >
                          <option value="">Select sub-category</option>
                          {expenseForm.categoryId &&
                            categories
                              .filter(
                                (c) =>
                                  c.parent?.id ===
                                  Number(expenseForm.categoryId)
                              )
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                        </select>
                        {!expenseForm.categoryId && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
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
                            Select a main category first
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Row 4: Payment Method */}
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
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        Payment Method
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            value: "credit-card",
                            label: "Credit Card",
                            icon: "💳",
                          },
                          {
                            value: "debit-card",
                            label: "Debit Card",
                            icon: "💳",
                          },
                          { value: "cash", label: "Cash", icon: "💵" },
                          { value: "online", label: "Online", icon: "🌐" },
                          {
                            value: "bank-transfer",
                            label: "Bank Transfer",
                            icon: "🏦",
                          },
                          { value: "others", label: "Others", icon: "🔧" },
                        ].map((payment) => (
                          <label key={payment.value} className="relative">
                            <input
                              type="radio"
                              name="paymentType"
                              value={payment.value}
                              checked={
                                expenseForm.paymentType === payment.value
                              }
                              onChange={(e) =>
                                setExpenseForm((prev) => ({
                                  ...prev,
                                  paymentType: e.target.value,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="p-2 border-2 border-gray-200 rounded-lg cursor-pointer transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-50/50 hover:border-gray-300 hover:bg-gray-50/50 text-center">
                              <div className="text-sm mb-1">{payment.icon}</div>
                              <div className="text-xs font-medium text-gray-700">
                                {payment.label}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Row 5: Tags */}
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
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        Tags
                      </label>
                      <div
                        className={`p-3 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50 min-h-[3rem] space-y-3 transition-all duration-300 ${
                          showAllExpenseSystemTags
                            ? "max-h-64 overflow-y-auto"
                            : "max-h-32 overflow-hidden"
                        }`}
                      >
                        {/* System Tags */}
                        {tags.filter((t) => t.isSystem).length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
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
                                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                                />
                              </svg>
                              Predefined Tags
                            </div>
                            <div className="flex flex-wrap gap-2 transition-all duration-300 ease-in-out">
                              {(showAllExpenseSystemTags
                                ? tags.filter((t) => t.isSystem)
                                : tags.filter((t) => t.isSystem).slice(0, 10)
                              ).map((t) => {
                                const active = expenseForm.tagIds.includes(
                                  t.id
                                );
                                return (
                                  <button
                                    type="button"
                                    key={t.id}
                                    onClick={() => toggleTag(t.id)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                                      active
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                                        : "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:shadow-md"
                                    }`}
                                  >
                                    {t.name}
                                  </button>
                                );
                              })}
                              {tags.filter((t) => t.isSystem).length > 10 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowAllExpenseSystemTags(
                                      !showAllExpenseSystemTags
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full border border-emerald-200 transition-colors duration-200 font-medium"
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
                                        showAllExpenseSystemTags
                                          ? "M5 15l7-7 7 7"
                                          : "M19 9l-7 7-7-7"
                                      }
                                    />
                                  </svg>
                                  {showAllExpenseSystemTags
                                    ? "Show Less"
                                    : `+${
                                        tags.filter((t) => t.isSystem).length -
                                        10
                                      } more`}
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* User Tags */}
                        {tags.filter((t) => !t.isSystem).length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
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
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              Your Tags
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {tags
                                .filter((t) => !t.isSystem)
                                .map((t) => {
                                  const active = expenseForm.tagIds.includes(
                                    t.id
                                  );
                                  return (
                                    <button
                                      type="button"
                                      key={t.id}
                                      onClick={() => toggleTag(t.id)}
                                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                                        active
                                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                                          : "bg-white/80 border border-gray-200 text-gray-600 hover:bg-white hover:shadow-md"
                                      }`}
                                    >
                                      {t.name}
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        {tags.length === 0 && (
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
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
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                              />
                            </svg>
                            No tags available yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100/50 sticky bottom-0 bg-white/95 backdrop-blur-sm px-6 pb-2 z-10 mt-6">
                    <button
                      type="button"
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 rounded-xl transition-all duration-200 font-medium"
                      onClick={() => {
                        setShowExpense(false);
                        setShowAllExpenseSystemTags(false);
                        setEditingExpense(null);
                        setExpenseForm({
                          amount: "",
                          description: "",
                          categoryId: "",
                          subCategoryId: "",
                          tagIds: [],
                          paymentType: "",
                          transactionDate: new Date()
                            .toISOString()
                            .slice(0, 16),
                        });
                      }}
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
                      ) : editingExpense ? (
                        "Update Expense"
                      ) : (
                        "Save Expense"
                      )}
                    </button>
                  </div>
                </form>
              )}

              {showCategory && (
                <form onSubmit={submitCategory} className="space-y-6">
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
                </form>
              )}

              {showTag && (
                <form onSubmit={submitTag} className="space-y-6">
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
                </form>
              )}

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
    </div>
  );
}
