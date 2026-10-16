import { useState } from "react";
import { LogIn, Loader2, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export default function LoginGate() {
  const { login, loginWithInviteCode } = useAuth();
  const [mode, setMode] = useState<"code" | "caregiver">("code");

  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginWithInviteCode(inviteCode.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't connect. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCaregiverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't sign in. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-sm bg-surface rounded-card shadow-cardHover p-8">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center">
            {mode === "code" ? <KeyRound className="w-7 h-7 text-primary-dark" /> : <LogIn className="w-7 h-7 text-primary-dark" />}
          </div>
          <h1 className="text-2xl font-bold text-center">VoiceBridge</h1>
          <p className="text-inkmuted text-center text-sm">
            {mode === "code"
              ? "Enter the code a caregiver gave you to set up this device."
              : "Sign in with your caregiver account."}
          </p>
        </div>

        {mode === "code" ? (
          <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-bold text-inkmuted mb-1">
                Invite code
              </label>
              <input
                id="inviteCode"
                type="text"
                required
                autoCapitalize="characters"
                placeholder="e.g. 7K9QX2LM"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border border-primary-light bg-canvas text-ink text-lg
                  tracking-widest text-center font-bold focus:border-primary outline-none"
              />
            </div>

            {error && <p role="alert" className="text-emergency font-bold text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex items-center justify-center gap-2 bg-primary text-white font-bold text-lg py-4
                rounded-full shadow-card active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
              Set up this device
            </button>
          </form>
        ) : (
          <form onSubmit={handleCaregiverSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-inkmuted mb-1">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-primary-light bg-canvas text-ink text-lg focus:border-primary outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-inkmuted mb-1">Password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-primary-light bg-canvas text-ink text-lg focus:border-primary outline-none"
              />
            </div>

            {error && <p role="alert" className="text-emergency font-bold text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex items-center justify-center gap-2 bg-primary text-white font-bold text-lg py-4
                rounded-full shadow-card active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              Sign in
            </button>
          </form>
        )}

        <button
          onClick={() => {
            setError(null);
            setMode(mode === "code" ? "caregiver" : "code");
          }}
          className="mt-4 w-full text-center text-sm text-inkmuted underline underline-offset-2"
        >
          {mode === "code" ? "I'm a caregiver — sign in with email instead" : "Use an invite code instead"}
        </button>
      </div>
    </div>
  );
}
