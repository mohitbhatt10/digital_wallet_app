import { useState, useEffect } from "react";
import { Category } from "../api/categories";
import { Tag } from "../api/tags";
import { Expense, createExpense, updateExpense } from "../api/expenses";
import { useAuth } from "../context/AuthContext";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  tags: Tag[];
  editingExpense: Expense | null;
  onSuccess: (expense: Expense, isEdit: boolean) => void;
}

// Helper: format a Date or ISO string into 'YYYY-MM-DDTHH:MM' in user's local timezone
function formatDateForInput(input?: string | Date) {
  const d = input ? new Date(input) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function ExpenseModal({
  isOpen,
  onClose,
  categories,
  tags,
  editingExpense,
  onSuccess,
}: ExpenseModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showAllExpenseSystemTags, setShowAllExpenseSystemTags] =
    useState(false);

  // Initialize form state based on editingExpense
  const getInitialFormState = () => {
    if (editingExpense) {
      let categoryId = "";
      let subCategoryId = "";

      if (editingExpense.category) {
        if (editingExpense.category.parentId) {
          categoryId = editingExpense.category.parentId.toString();
          subCategoryId = editingExpense.category.id.toString();
        } else {
          categoryId = editingExpense.category.id.toString();
          subCategoryId = "";
        }
      }

      return {
        amount: editingExpense.amount.toString(),
        description: editingExpense.description || "",
        categoryId: categoryId,
        subCategoryId: subCategoryId,
        tagIds: editingExpense.tags?.map((tag) => tag.id) || [],
        paymentType: editingExpense.paymentType || "",
        transactionDate: editingExpense.transactionDate
          ? formatDateForInput(editingExpense.transactionDate)
          : formatDateForInput(),
      };
    }

    return {
      amount: "",
      description: "",
      categoryId: "",
      subCategoryId: "",
      tagIds: [] as number[],
      paymentType: "",
      transactionDate: formatDateForInput(),
    };
  };

  const [expenseForm, setExpenseForm] = useState(getInitialFormState());

  // Update form when editingExpense or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setExpenseForm(getInitialFormState());
      setError(undefined);
      setShowAllExpenseSystemTags(false);
    }
  }, [editingExpense, isOpen]);

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
      const formatLocalDateTimeForServer = (value: string) => {
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
          d.getDate()
        )}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };

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
          ? formatLocalDateTimeForServer(expenseForm.transactionDate)
          : undefined,
      };

      let result: Expense;
      if (editingExpense) {
        result = await updateExpense(editingExpense.id, payload);
        onSuccess(result, true);
      } else {
        result = await createExpense(payload);
        onSuccess(result, false);
      }

      handleClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          `Failed to ${editingExpense ? "update" : "create"} expense`
      );
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    setExpenseForm({
      amount: "",
      description: "",
      categoryId: "",
      subCategoryId: "",
      tagIds: [],
      paymentType: "",
      transactionDate: formatDateForInput(),
    });
    setError(undefined);
    setShowAllExpenseSystemTags(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300 overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl w-full max-w-4xl relative overflow-hidden transform transition-all duration-500 scale-100 opacity-100 my-8">
        {/* Header gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>

        {/* Close button */}
        <button
          className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white/90 transition-all duration-200 hover:scale-105 shadow-sm"
          onClick={handleClose}
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
                          (c) => c.parent?.id === Number(expenseForm.categoryId)
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
                        checked={expenseForm.paymentType === payment.value}
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
                          const active = expenseForm.tagIds.includes(t.id);
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
                                  tags.filter((t) => t.isSystem).length - 10
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
                            const active = expenseForm.tagIds.includes(t.id);
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
                onClick={handleClose}
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
        </div>
      </div>
    </div>
  );
}
