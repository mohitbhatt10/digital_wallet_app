import { ReactNode, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface LayoutProps {
  children: ReactNode;
  showAuthActions?: boolean;
  currentPage?: string;
}

export default function Layout({
  children,
  showAuthActions = true,
  currentPage,
}: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-blue-50" />

      {/* Header */}
      <header className="relative z-40 px-8 py-4 flex items-center justify-between backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/60 border-b border-zinc-200/60">
        <Link
          to={user ? "/dashboard" : "/"}
          className="flex items-center gap-2"
          aria-label="Digital Wallet Home"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            DW
          </div>
          <span className="font-semibold gradient-text hidden sm:inline">
            Digital Wallet
          </span>
        </Link>

        <div className="flex items-center gap-8">
          {user && showAuthActions ? (
            <>
              {/* Navigation Links */}
              <nav className="flex items-center gap-3 text-sm">
                {[
                  { key: "dashboard", label: "Dashboard", to: "/dashboard" },
                  {
                    key: "filters",
                    label: "Filter Expenses",
                    to: "/expenses/filter",
                  },
                ].map((item) => {
                  const active = currentPage === item.key;
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      className={`relative px-5 py-2 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 focus:ring-offset-white ${
                        active
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
                      }`}
                    >
                      {item.label}
                      {active && (
                        <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* User Dropdown */}
              <div className="relative z-50" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="group flex items-center gap-3 px-3 py-2 rounded-full hover:bg-gray-100/70 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 focus:ring-offset-white"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {(user.firstName || user.username || "U")
                      .substring(0, 1)
                      .toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-800 leading-none">
                      {user.firstName || user.username}
                    </span>
                    <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
                      Online
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      menuOpen ? "rotate-180" : ""
                    }
                    `}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-60 rounded-2xl bg-white/90 backdrop-blur-xl shadow-xl ring-1 ring-black/5 border border-white/40 p-2 animate-in fade-in slide-in-from-top-2 z-50"
                  >
                    <div className="px-3 py-2 text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                      Account
                    </div>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full text-left px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100/80 text-gray-700 flex items-center gap-2 transition-colors"
                      role="menuitem"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold">
                        P
                      </span>
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors"
                      role="menuitem"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-red-100 text-red-600 text-xs font-semibold">
                        ⎋
                      </span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : showAuthActions ? (
            /* Auth Links for non-authenticated users */
            <div className="flex items-center gap-2 text-sm">
              {currentPage !== "login" && (
                <Link to="/login" className="btn-ghost">
                  Login
                </Link>
              )}
              {currentPage !== "signup" && (
                <Link to="/signup" className="btn-ghost">
                  Sign up
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="px-6 py-10 text-center text-xs text-zinc-500">
        © 2025 Digital Wallet. All rights reserved.
      </footer>
    </div>
  );
}
