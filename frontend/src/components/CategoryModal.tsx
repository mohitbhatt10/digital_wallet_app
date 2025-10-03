import { useState } from "react";
import { Category, createCategory } from "../api/categories";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: (created: Category[]) => void; // returns 1+ categories created
}

export default function CategoryModal({
  isOpen,
  onClose,
  categories,
  onSuccess,
}: CategoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    parentId: "",
    categoryType: "",
    subCategories: [""] as string[],
  });

  const handleClose = () => {
    setCategoryForm({ name: "", parentId: "", categoryType: "", subCategories: [""] });
    setError(undefined);
    onClose();
  };

  async function submitCategory(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      if (categoryForm.categoryType === "main") {
        // Create main and any sub-categories
        const mainCategory = await createCategory({ name: categoryForm.name });
        const newCategories: Category[] = [mainCategory];

        for (const sub of categoryForm.subCategories) {
          const subName = sub.trim();
          if (subName) {
            const subCat = await createCategory({ name: subName, parentId: mainCategory.id });
            newCategories.push(subCat);
          }
        }
        onSuccess(newCategories);
      } else {
        // Create a single (sub) category (or main if no parent selected)
        const created = await createCategory({
          name: categoryForm.name,
          parentId: categoryForm.parentId ? Number(categoryForm.parentId) : undefined,
        });
        onSuccess([created]);
      }

      handleClose();
    } catch (err) {
      setError("Failed to create category");
    } finally {
      setLoading(false);
    }
  }

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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Error */}
        {error && (
          <div className="mx-8 mt-8 p-4 text-sm text-red-700 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="relative max-h-[80vh] overflow-y-auto">
          <form onSubmit={submitCategory} className="space-y-6">
            {/* Title */}
            <div className="flex items-center gap-3 sticky top-0 bg-white/95 backdrop-blur-sm py-4 px-6 border-b border-gray-100/50 z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Create Category</h2>
                <p className="text-sm text-gray-500">Organize your expenses with categories</p>
              </div>
            </div>

            <div className="px-6">
              {/* Category Type */}
              <div className="space-y-3 mt-6">
                <label className="text-sm font-semibold text-gray-700">Category Type</label>
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
                          <svg className="w-4 h-4 text-purple-600 peer-checked:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2M7 7h10" />
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

              {/* Parent Category + Name row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryForm.categoryType === "sub" && (
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
                      onChange={(e) => setCategoryForm((prev) => ({ ...prev, parentId: e.target.value }))}
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

                <div className={`space-y-2 ${categoryForm.categoryType === "sub" ? "" : "md:col-span-2"}`}>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {categoryForm.categoryType === "main" ? "Main Category Name" : "Category Name"}
                  </label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200 hover:bg-white/80"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={categoryForm.categoryType === "main" ? "e.g. Transportation" : "e.g. Public Transport"}
                  />
                </div>
              </div>

              {/* Sub-categories (main only) */}
              {categoryForm.categoryType === "main" && (
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
                              const updated = [...categoryForm.subCategories];
                              updated[index] = e.target.value;
                              setCategoryForm((prev) => ({ ...prev, subCategories: updated }));
                            }}
                            placeholder={`Sub-category ${index + 1}`}
                          />
                          {categoryForm.subCategories.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = categoryForm.subCategories.filter((_, i) => i !== index);
                                setCategoryForm((prev) => ({ ...prev, subCategories: updated }));
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
                      onClick={() => setCategoryForm((prev) => ({ ...prev, subCategories: [...prev.subCategories, ""] }))}
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
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100/50 sticky bottom-0 bg-white/95 backdrop-blur-sm px-6 pb-2 z-10 mt-6">
              <button
                type="button"
                className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 rounded-xl transition-all duration-200 font-medium"
                onClick={handleClose}
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
                ) : (
                  "Create Category"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
