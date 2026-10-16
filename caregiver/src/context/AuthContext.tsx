import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getToken } from "../api/client";
import * as authApi from "../api/auth";
import type { DashboardUser } from "../types";

// Token storage: localStorage, per Phase 4 spec Section 5 — this is a
// reasonable default for a caregiver's own device (not a shared kiosk).
const USER_KEY = "voicebridge_caregiver_user";

interface AuthContextValue {
  user: DashboardUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, inviteCode?: string) => Promise<void>;
  loginWithInviteCode: (inviteCode: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<DashboardUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as DashboardUser) : null;
  });

  // If api/client.ts clears the token on a 401 from some other tab/call,
  // pick that up so this context's state doesn't lie about being logged in.
  useEffect(() => {
    const syncFromStorage = () => {
      const current = getToken();
      if (!current) {
        setTokenState(null);
        setUser(null);
      }
    };
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("focus", syncFromStorage);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("focus", syncFromStorage);
    };
  }, []);

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password);
    setTokenState(res.accessToken);
    setUser(res.user);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }

  async function register(name: string, email: string, password: string, inviteCode?: string) {
    const res = await authApi.register(name, email, password, inviteCode);
    setTokenState(res.accessToken);
    setUser(res.user);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }

  async function loginWithInviteCode(inviteCode: string) {
    const res = await authApi.patientAccess(inviteCode);
    setTokenState(res.accessToken);
    setUser(res.user);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }

  function logout() {
    authApi.logout();
    localStorage.removeItem(USER_KEY);
    setTokenState(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!token, login, register, loginWithInviteCode, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
