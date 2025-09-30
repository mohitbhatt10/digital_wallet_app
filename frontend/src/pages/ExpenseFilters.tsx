import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listCategories, Category } from "../api/categories";
import { listTags, Tag } from "../api/tags";
import { Expense, filterExpenses, PagedResponse, updateExpense, deleteExpense } from "../api/expenses";
import Layout from "../components/Layout";

interface FilterState {
  startDate: string;
  endDate: string;
  categoryIds: number[];
  tagIds: number[];
}

export default function ExpenseFilters() {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);
  const [showEdit, setShowEdit] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    description: "",
    categoryId: "",
    tagIds: [] as number[],
    paymentType: "",
    transactionDate: "",
  });
  // Aggregate total across ALL filtered pages (not just current page)
  const [totalFilteredAmount, setTotalFilteredAmount] = useState<number | null>(
    null
  );
  const [totalCalcLoading, setTotalCalcLoading] = useState(false);

  const [filters, setFilters] = useState<FilterState>(() => {
    // Default to first day of current month through today
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    // Use a local date formatter (YYYY-MM-DD) to avoid UTC shift from toISOString()
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    return {
      startDate: fmt(firstDayOfMonth),
      endDate: fmt(today),
      categoryIds: [],
      tagIds: [],
    };
  });

  // Currency formatting helpers
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
    return amount.toFixed(2);
  };

  // Tag color palette
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

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [categoriesData, tagsData] = await Promise.all([
        listCategories(),
        listTags(),
      ]);
      setCategories(categoriesData);
      setTags(tagsData);
      // Apply default filters (current month) on first load
      applyFilters(0);
    } catch (err) {
      setError("Failed to load filter options");
    }
  }

  async function applyFilters(page: number = 0) {
    setLoading(true);
    setError(undefined);
    // Reset aggregate total when starting a fresh filter from page 0
    if (page === 0) {
      setTotalFilteredAmount(null);
    }

    try {
      const response = await filterExpenses({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        categoryIds:
          filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
        tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
        page,
        size: pageSize,
      });

      setExpenses(response.content);
      setCurrentPage(response.number);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);

      // Kick off total amount aggregation only when applying filters from the first page
      if (page === 0) {
        calculateTotalAcrossAllPages(response);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to filter expenses");
    } finally {
      setLoading(false);
    }
  }

  // Compute sum across all filtered pages without loading all items into UI state
  async function calculateTotalAcrossAllPages(
    firstPage: PagedResponse<Expense>
  ) {
    try {
      setTotalCalcLoading(true);
      let aggregate = firstPage.content.reduce((s, e) => s + e.amount, 0);
      const totalPagesLocal = firstPage.totalPages;
      if (totalPagesLocal > 1) {
        // Fetch remaining pages sequentially to avoid server overload (can optimize later)
        for (let p = 1; p < totalPagesLocal; p++) {
          try {
            const pageResp = await filterExpenses({
              startDate: filters.startDate || undefined,
              endDate: filters.endDate || undefined,
              categoryIds:
                filters.categoryIds.length > 0
                  ? filters.categoryIds
                  : undefined,
              tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
              page: p,
              size: pageSize,
            });
            aggregate += pageResp.content.reduce((s, e) => s + e.amount, 0);
          } catch (e) {
            // If any page fails, stop aggregation and fall back to partial
            break;
          }
        }
      }
      setTotalFilteredAmount(aggregate);
    } finally {
      setTotalCalcLoading(false);
    }
  }

  function clearFilters() {
    setFilters({
      startDate: "",
      endDate: "",
      categoryIds: [],
      tagIds: [],
    });
    setExpenses([]);
    setCurrentPage(0);
    setTotalPages(0);
    setTotalElements(0);
  }

  function handlePageChange(newPage: number) {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      applyFilters(newPage);
    }
  }

  function toggleCategory(categoryId: number) {
    setFilters((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  }

  function toggleTag(tagId: number) {
    setFilters((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const formatLocalDate = (iso: string) => {
    if (!iso) return ""; const d = new Date(iso); const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`;
  };
  const formatLocalTime = (iso: string) => {
    if (!iso) return ""; const d = new Date(iso); const hh = String(d.getHours()).padStart(2,'0'); const mi = String(d.getMinutes()).padStart(2,'0'); return `${hh}:${mi}`;
  };
  function handleEditClick(exp: Expense){
    setEditingExpense(exp);
    setExpenseForm({
      amount: String(exp.amount),
      description: exp.description||"",
      categoryId: exp.category?.id? String(exp.category.id):"",
      tagIds: exp.tags? exp.tags.map(t=>t.id):[],
      paymentType: exp.paymentType||"",
      transactionDate: exp.transactionDate? exp.transactionDate.substring(0,16):"",
    });
    setShowEdit(true);
  }
  async function handleDeleteClick(id:number){
    if(!window.confirm('Delete this expense?')) return; try { await deleteExpense(id); applyFilters(0);} catch{ alert('Failed to delete expense'); }
  }
  async function handleEditSubmit(e:React.FormEvent){ e.preventDefault(); if(!editingExpense) return; try { await updateExpense(editingExpense.id, { amount: parseFloat(expenseForm.amount), description: expenseForm.description, categoryId: expenseForm.categoryId? Number(expenseForm.categoryId): undefined, tagIds: expenseForm.tagIds, paymentType: expenseForm.paymentType || undefined, transactionDate: expenseForm.transactionDate? new Date(expenseForm.transactionDate).toISOString(): editingExpense.transactionDate}); setShowEdit(false); setEditingExpense(null); applyFilters(currentPage);} catch { alert('Failed to update expense'); } }
  const hasActiveFilters =
    filters.startDate ||
    filters.endDate ||
    filters.categoryIds.length > 0 ||
    filters.tagIds.length > 0;

  if (!user) return null;

  return (
    <>
    <Layout currentPage="filters">
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Filter Expenses
            </h1>
            <p className="text-gray-600">
              Find expenses by date range, categories, and tags
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Filters Panel */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
                    />
                  </svg>
                  Filters
                </h2>

                {/* Date Range */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-medium text-gray-700">Date Range</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        value={filters.startDate}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        value={filters.endDate}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <h3 className="font-medium text-gray-700">Categories</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {categories
                        .filter((c) => !c.parent)
                        .map((category) => (
                          <div key={category.id}>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.categoryIds.includes(
                                  category.id
                                )}
                                onChange={() => toggleCategory(category.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {category.name}
                              </span>
                            </label>
                            {/* Sub-categories */}
                            {categories
                              .filter((sub) => sub.parent?.id === category.id)
                              .map((subCat) => (
                                <label
                                  key={subCat.id}
                                  className="flex items-center gap-2 ml-6 mt-1 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={filters.categoryIds.includes(
                                      subCat.id
                                    )}
                                    onChange={() => toggleCategory(subCat.id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-600">
                                    {subCat.name}
                                  </span>
                                </label>
                              ))}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <h3 className="font-medium text-gray-700">Tags</h3>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                      {tags.map((tag) => {
                        const isSelected = filters.tagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                              isSelected
                                ? "bg-blue-500 text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => applyFilters(0)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
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
                        Filtering...
                      </div>
                    ) : (
                      "Apply Filters"
                    )}
                  </button>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-2">
              {expenses.length > 0 && (
                <div className="card p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Results Summary</h2>
                    <div className="text-right space-y-1">
                      <div className="text-2xl font-bold text-gray-900 min-h-[2rem] flex items-center justify-end">
                        {totalCalcLoading ? (
                          <span className="text-sm font-medium text-gray-400 animate-pulse">
                            Calculating…
                          </span>
                        ) : (
                          formatCurrency(totalFilteredAmount ?? totalAmount)
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Page {currentPage + 1} of {totalPages} • {totalElements}{" "}
                        total expense
                        {totalElements !== 1 ? "s" : ""}
                        {totalFilteredAmount != null && totalPages > 1 && (
                          <span className="block text-[11px] text-gray-400">
                            (Sum across all filtered pages)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4">Expense Records</h2>

                {expenses.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 text-gray-300 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No expenses found
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {hasActiveFilters
                        ? "Try adjusting your filters or expanding the date range to find more expenses."
                        : "Apply filters above to search for specific expenses."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenses.map((expense, idx) => {
                      const palette = ["bg-gradient-to-br from-indigo-500 to-indigo-600","bg-gradient-to-br from-rose-500 to-pink-600","bg-gradient-to-br from-emerald-500 to-teal-600","bg-gradient-to-br from-amber-500 to-orange-600","bg-gradient-to-br from-blue-500 to-cyan-600"];
                      const avatarColor = palette[idx % palette.length];
                      return (
                        <div key={expense.id} className="group relative px-5 py-4 flex items-start gap-4 rounded-2xl border border-zinc-200/60 bg-white/70 backdrop-blur-sm hover:shadow-md transition-all">
                          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-white text-sm font-semibold shadow-sm shrink-0 ${avatarColor}`}>
                            {expense.category?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-zinc-800 text-sm truncate max-w-[180px]" title={expense.description || expense.category?.name}>{formatCurrency(expense.amount)}</span>
                                  {expense.paymentType && <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium">{expense.paymentType.replace('-', ' ')}</span>}
                                </div>
                                <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-[260px]" title={expense.description}>{expense.category?.name || '—'}{expense.description ? ` · ${expense.description}` : ''}</div>
                                {expense.tags && expense.tags.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">{expense.tags.slice(0,5).map(tag => <span key={tag.id} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getTagClass(tag)}`}>{tag.name}</span>)}{expense.tags.length>5 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">+{expense.tags.length-5}</span>}</div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
                                  <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-200 shadow-sm flex items-center gap-1"><svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>{formatLocalDate(expense.transactionDate)}</span>
                                  <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-200 shadow-sm flex items-center gap-1"><svg className="w-3 h-3 text-pink-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>{formatLocalTime(expense.transactionDate)}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1">
                                  <button onClick={()=>handleEditClick(expense)} className="p-1.5 rounded-md bg-white/90 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 border border-zinc-200 shadow-sm" title="Edit expense" aria-label="Edit expense"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                                  <button onClick={()=>handleDeleteClick(expense.id)} className="p-1.5 rounded-md bg-white/90 hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-zinc-200 shadow-sm" title="Delete expense" aria-label="Delete expense"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination Controls */}
                {expenses.length > 0 && totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {currentPage * pageSize + 1} to{" "}
                      {Math.min((currentPage + 1) * pageSize, totalElements)} of{" "}
                      {totalElements} expenses
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i;
                            } else if (currentPage <= 2) {
                              pageNum = i;
                            } else if (currentPage >= totalPages - 3) {
                              pageNum = totalPages - 5 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                  pageNum === currentPage
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum + 1}
                              </button>
                            );
                          }
                        )}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  </Layout>
    {showEdit && (
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
        {/* Click catcher (optional future) */}
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-xl my-8 rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-zinc-200 ring-1 ring-zinc-200/60"
        >
          <button
            onClick={()=>{setShowEdit(false); setEditingExpense(null);}}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-zinc-100/90 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors shadow-sm"
            aria-label="Close edit dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div className="p-8 pt-10 overflow-y-auto max-h-[calc(100vh-6rem)]">
            <h3 className="text-xl font-semibold mb-6">Edit Expense</h3>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Amount</label>
                  <input type="number" step="0.01" required value={expenseForm.amount} onChange={e=>setExpenseForm(f=>({...f, amount:e.target.value}))} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Payment Type</label>
                  <input type="text" value={expenseForm.paymentType} onChange={e=>setExpenseForm(f=>({...f, paymentType:e.target.value}))} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Category</label>
                  <select value={expenseForm.categoryId} onChange={e=>setExpenseForm(f=>({...f, categoryId:e.target.value}))} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"><option value="">— None —</option>{categories.filter(c=>!c.parent).map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Date & Time</label>
                  <input type="datetime-local" value={expenseForm.transactionDate} onChange={e=>setExpenseForm(f=>({...f, transactionDate:e.target.value}))} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Description</label>
                  <input type="text" value={expenseForm.description} onChange={e=>setExpenseForm(f=>({...f, description:e.target.value}))} className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">{tags.map(tag=>{ const selected = expenseForm.tagIds.includes(tag.id); return <button type="button" key={tag.id} onClick={()=> setExpenseForm(f=>({...f, tagIds: selected? f.tagIds.filter(id=>id!==tag.id): [...f.tagIds, tag.id]}))} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selected? 'bg-indigo-600 text-white shadow':'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>{tag.name}</button>; })}</div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={()=>{setShowEdit(false); setEditingExpense(null);}} className="px-5 py-2 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-sm font-medium">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm text-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
