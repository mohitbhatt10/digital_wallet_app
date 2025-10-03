import { useState } from "react";
import { Tag, createTag } from "../api/tags";

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[]; // existing tags for duplicate checks and listing
  onSuccess: (created: Tag) => void;
}

export default function TagModal({ isOpen, onClose, tags, onSuccess }: TagModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showAllSystemTags, setShowAllSystemTags] = useState(false);
  const [tagForm, setTagForm] = useState({ name: "" });

  const handleClose = () => {
    setTagForm({ name: "" });
    setError(undefined);
    setShowAllSystemTags(false);
    onClose();
  };

  async function submitTag(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      const existingTag = tags.find((t) => t.name.toLowerCase() === tagForm.name.toLowerCase());
      if (existingTag) {
        setError(`Tag "${tagForm.name}" already exists`);
        setLoading(false);
        return;
      }

      const created = await createTag({ name: tagForm.name });
      onSuccess(created);
      handleClose();
    } catch {
      setError("Failed to create tag");
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
          <form onSubmit={submitTag} className="space-y-6">
            {/* Title */}
            <div className="flex items-center gap-3 sticky top-0 bg-white/95 backdrop-blur-sm py-4 px-6 border-b border-gray-100/50 z-10">
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

            <div className="px-6 pb-4">
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
                  className={`w-full px-4 py-3 bg-white/60 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 hover:bg-white/80 ${
                    tagForm.name && !!tags.find((t) => t.name.toLowerCase() === tagForm.name.toLowerCase())
                      ? "border-red-300 focus:ring-red-500/20 focus:border-red-400"
                      : "border-gray-200/50 focus:ring-pink-500/20 focus:border-pink-400"
                  }`}
                  value={tagForm.name}
                  onChange={(e) => setTagForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Work, Personal, Urgent"
                />
                {tagForm.name && !!tags.find((t) => t.name.toLowerCase() === tagForm.name.toLowerCase()) && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    This tag name already exists
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tags help you filter and organize expenses across categories
                </div>
              </div>

              {/* Existing Tags */}
              {tags.length > 0 && (
                <div className="space-y-3 mt-6">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Existing Tags
                  </label>
                  <div className={`p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-y-auto transition-all duration-300 ${
                    showAllSystemTags ? "max-h-48" : "max-h-32"
                  }`}>
                    <div className="space-y-3">
                      {/* System Tags */}
                      {tags.filter((t) => t.isSystem).length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-emerald-700 mb-2">System Tags</div>
                          <div className="flex flex-wrap gap-1.5 transition-all duration-300 ease-in-out">
                            {(showAllSystemTags ? tags.filter((t) => t.isSystem) : tags.filter((t) => t.isSystem).slice(0, 10)).map((tag) => (
                              <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-medium">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                {tag.name}
                              </span>
                            ))}
                            {tags.filter((t) => t.isSystem).length > 10 && (
                              <button
                                type="button"
                                onClick={() => setShowAllSystemTags(!showAllSystemTags)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors duration-200 font-medium"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAllSystemTags ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                                </svg>
                                {showAllSystemTags ? "Show Less" : `+${tags.filter((t) => t.isSystem).length - 10} more`}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* User Tags */}
                      {tags.filter((t) => !t.isSystem).length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-blue-700 mb-2">Your Tags</div>
                          <div className="flex flex-wrap gap-1.5">
                            {tags.filter((t) => !t.isSystem).map((tag) => (
                              <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
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
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Make sure your new tag name doesn't duplicate existing ones
                  </div>
                </div>
              )}

              {/* Tag Preview */}
              {tagForm.name && (
                <div className="space-y-2 transform transition-all duration-300">
                  <label className="text-sm font-semibold text-gray-700">Preview</label>
                  <div className="p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-full text-sm font-medium shadow-lg shadow-pink-500/25">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1 1 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {tagForm.name}
                    </div>
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
                disabled={
                  loading ||
                  (tagForm.name && !!tags.find((t) => t.name.toLowerCase() === tagForm.name.toLowerCase()))
                }
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
                ) : (
                  "Create Tag"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
