import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

type Mode = "password" | "inviteCode";

export default function LoginPage() {
  const { login, loginWithInviteCode, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "password") {
        await login(email, password);
      } else {
        await loginWithInviteCode(inviteCode);
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't sign in. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-card bg-surface p-8 shadow-card">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
            VB
          </div>
          <h1 className="text-xl font-semibold text-ink">VoiceBridge Caregiver</h1>
          <p className="mt-1 text-sm text-inkmuted">Sign in to manage messages and contacts.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "password" ? (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ink">
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-ink/15 px-3 py-2 pr-10 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-inkmuted hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-ink">
                Invite code
              </label>
              <input
                id="inviteCode"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. 7K9QX2LM"
                className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm uppercase tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
              <p className="mt-1 text-xs text-inkmuted">
                Get this from another caregiver's dashboard ("Share access").
              </p>
            </div>
          )}

          {error && <p className="text-sm font-medium text-emergency">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-5 space-y-2 text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode((m) => (m === "password" ? "inviteCode" : "password"));
            }}
            className="font-medium text-primary hover:underline"
          >
            {mode === "password" ? "Sign in with invite code instead" : "Sign in with email and password instead"}
          </button>
          <p className="text-inkmuted">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
