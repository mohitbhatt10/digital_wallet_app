import { useState } from "react";
import { login } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApiBase } from "../api/http";

const API_BASE = getApiBase();

export default function Login() {
  const [usernameOrEmail, setU] = useState("");
  const [password, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = await login({ usernameOrEmail, password });
      localStorage.setItem("auth_token", token);
      await refresh();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
      <nav className="px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
            DW
          </div>
          <span className="font-semibold gradient-text">Digital Wallet</span>
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <Link to="/signup" className="btn-ghost">
            Sign up
          </Link>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <h2 className="text-2xl font-semibold">Welcome back</h2>
            <p className="mt-1 text-sm text-zinc-500">Sign in to continue</p>
            <form onSubmit={submit} className="mt-6 grid gap-5">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </div>
              )}
              <div className="grid gap-1">
                <label className="text-xs font-medium text-zinc-600">
                  Email or Username
                </label>
                <input
                  className="input"
                  placeholder="you@example.com"
                  autoComplete="username"
                  value={usernameOrEmail}
                  onChange={(e) => setU(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-zinc-600">
                  Password
                </label>
                <input
                  className="input"
                  placeholder="••••••••"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setP(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
            <div className="mt-6">
              <button
                className="btn-secondary w-full"
                type="button"
                onClick={() => {
                  window.location.href = `${API_BASE}/oauth2/authorization/google`;
                }}
              >
                Continue with Google
              </button>
            </div>
            <div className="mt-6 text-center text-xs text-zinc-500">
              No account?{" "}
              <Link to="/signup" className="text-blue-600 hover:underline">
                Create one
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
