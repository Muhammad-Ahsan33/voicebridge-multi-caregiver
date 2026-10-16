import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { login as apiLogin, patientAccess as apiPatientAccess, type DashboardUser, type PatientInfo } from "../api/auth";
import { clearToken, getToken, setToken, setUnauthorizedHandler } from "../api/client";

interface AuthContextValue {
  user: DashboardUser | null; // null when signed in via invite code (patient device)
  patient: PatientInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithInviteCode: (inviteCode: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "voicebridge_user";
const PATIENT_KEY = "voicebridge_patient";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PATIENT_KEY);
    setUser(null);
    setPatient(null);
  };

  useEffect(() => {
    const token = getToken();
    const storedPatient = localStorage.getItem(PATIENT_KEY);
    if (token && storedPatient) {
      try {
        setPatient(JSON.parse(storedPatient));
        const storedUser = localStorage.getItem(USER_KEY);
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch {
        logout();
      }
    }
    setIsLoading(false);
    setUnauthorizedHandler(() => logout());
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setToken(res.accessToken);
    localStorage.setItem(PATIENT_KEY, JSON.stringify(res.patient));
    setPatient(res.patient);
    if (res.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setUser(res.user);
    }
  };

  const loginWithInviteCode = async (inviteCode: string) => {
    const res = await apiPatientAccess(inviteCode);
    setToken(res.accessToken);
    localStorage.setItem(PATIENT_KEY, JSON.stringify(res.patient));
    localStorage.removeItem(USER_KEY);
    setPatient(res.patient);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, patient, isAuthenticated: !!patient, isLoading, login, loginWithInviteCode, logout }}
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
