import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  // Local state for copy feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function copy(value?: string) {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(value);
      setTimeout(() => setCopiedField(null), 1600);
    });
  }

  const initials = (user.firstName || user.username || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const infoRows: { label: string; value?: string; copy?: boolean }[] = [
    { label: "Username", value: user.username, copy: true },
    { label: "First Name", value: user.firstName },
    { label: "Last Name", value: user.lastName },
    { label: "Email", value: user.email, copy: true },
    { label: "Country", value: user.country },
    { label: "Currency", value: user.currency },
  ].filter((r) => r.value);

  return (
    <Layout currentPage="profile">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              Profile
            </h1>
            <p className="mt-2 text-sm text-zinc-500 max-w-prose">
              Manage your personal identity, regional preferences and account
              metadata. These details power currency formatting and localized
              experiences across the app.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium shadow-sm hover:bg-zinc-800 transition-colors">
              Edit Profile
            </button>
            <button className="px-4 py-2 rounded-lg bg-white/70 backdrop-blur border border-zinc-200 text-sm font-medium hover:bg-white transition-colors">
              Preferences
            </button>
          </div>
        </div>

        <div className="grid xl:grid-cols-3 gap-8">
          {/* Left column: identity card */}
          <div className="xl:col-span-1 space-y-8">
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-gradient-to-br from-white/80 via-white to-zinc-50/60 backdrop-blur-md shadow-sm">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-100 rounded-full opacity-60 blur-2xl"></div>
              <div className="absolute -bottom-12 -left-8 w-52 h-52 bg-pink-100 rounded-full opacity-50 blur-3xl"></div>
              <div className="p-8 relative">
                <div className="flex items-start gap-5">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-600 text-white flex items-center justify-center text-3xl font-semibold shadow-lg ring-4 ring-white/60">
                      {initials}
                    </div>
                    <div className="absolute -bottom-2 -right-2 px-2 py-1 rounded-lg bg-white/90 border border-indigo-200 text-[10px] font-medium text-indigo-600 shadow-sm group-hover:scale-105 transition-transform">
                      Active
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-zinc-800 truncate">
                      {user.firstName || user.username}
                    </h2>
                    {user.email && (
                      <p className="mt-1 text-sm text-zinc-500 truncate">
                        {user.email}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {user.country && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17.657 16.657L13.414 20.9a1 1 0 01-1.414 0l-4.243-4.243M6.343 7.343L10.586 3.1a1 1 0 011.414 0l4.243 4.243M9 10h.01M15 14h.01M11 6h2M12 16v2M8 12h.01M16 8h.01"
                            />
                          </svg>
                          {user.country}
                        </span>
                      )}
                      {user.currency && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.598 1M12 8V6m0 2v8m0 0v2m0-2c-1.11 0-2.08-.402-2.598-1M5 8h14"
                            />
                          </svg>
                          {user.currency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200/70 bg-white/80 backdrop-blur p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-700 mb-4 uppercase tracking-wide">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="group flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-sm font-medium transition-colors border border-zinc-200">
                  <svg
                    className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Budget
                </button>
                <button className="group flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-sm font-medium transition-colors border border-zinc-200">
                  <svg
                    className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 7h16M4 7l4 14h8l4-14M10 11v4M14 11v4"
                    />
                  </svg>
                  New Expense
                </button>
                <button className="group flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-sm font-medium transition-colors border border-zinc-200 col-span-2">
                  <svg
                    className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v8m0 0l3-3m-3 3l-3-3m9-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Sync / Refresh Data
                </button>
              </div>
            </div>
          </div>

          {/* Right column: detailed info */}
          <div className="xl:col-span-2 space-y-8">
            <div className="rounded-3xl border border-zinc-200/70 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
              <div className="px-8 pt-8 pb-6 border-b border-zinc-200/60 bg-gradient-to-r from-white/60 to-zinc-50/50">
                <h2 className="text-lg font-semibold text-zinc-800 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Account Details
                </h2>
              </div>
              <div className="p-8">
                <dl className="grid sm:grid-cols-2 gap-6 text-sm">
                  {infoRows.map((row) => (
                    <div key={row.label} className="group">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 flex items-center gap-1">
                        {row.label}
                      </dt>
                      <dd className="mt-1 flex items-center gap-2">
                        <span
                          className="font-medium text-zinc-800 truncate"
                          title={row.value}
                        >
                          {row.value}
                        </span>
                        {row.copy && row.value && (
                          <button
                            type="button"
                            onClick={() => copy(row.value)}
                            className={`relative p-1.5 rounded-md border text-[10px] font-medium transition-colors ${
                              copiedField === row.value
                                ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                            }`}
                            aria-label={`Copy ${row.label}`}
                          >
                            {copiedField === row.value ? (
                              <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M8 16h8a2 2 0 002-2V8m-6 8h2m-2 0H8"
                                />
                              </svg>
                            )}
                          </button>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200/70 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
              <div className="px-8 pt-8 pb-6 border-b border-zinc-200/60 bg-gradient-to-r from-white/60 to-zinc-50/50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-800 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-pink-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 7h18M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l6 6m6 0l6-6"
                    />
                  </svg>
                  Preferences & Status
                </h2>
                <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                  Healthy
                </span>
              </div>
              <div className="p-8">
                <ul className="space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.598 1M12 8V6m0 2v8m0 0v2m0-2c-1.11 0-2.08-.402-2.598-1M5 8h14"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-700">
                        Currency Formatting
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        Values across the dashboard and reports use your
                        selected currency:{" "}
                        <span className="font-medium text-zinc-700">
                          {user.currency || "—"}
                        </span>
                        .
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shadow-sm">
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
                          d="M12 8c-3.866 0-7 2.239-7 5 0 1.657 1.343 3 3 3h8c1.657 0 3-1.343 3-3 0-2.761-3.134-5-7-5z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.5 15a2.5 2.5 0 015 0"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-700">Privacy</p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        We store minimal data—basic identity & localization—used
                        solely to personalize your finance experience.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
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
                          d="M11.3 3.27a1 1 0 011.4 0l8 7.5a1 1 0 01.3.73V20a1 1 0 01-1 1h-5a1 1 0 01-1-1v-4H10v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-8.5a1 1 0 01.3-.73l8-7.5z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-700">
                        Region & Locale
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        Country preference:{" "}
                        <span className="font-medium text-zinc-700">
                          {user.country || "—"}
                        </span>
                        . Date/time & number formats adapt automatically.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
