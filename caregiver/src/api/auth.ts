import { apiClient, setToken, clearToken } from "./client";
import type { DashboardUser } from "../types";

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  user: DashboardUser;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>("/auth/login", { email, password });
  setToken(res.accessToken);
  return res;
}

// inviteCode is optional: omitted -> creates a brand new patient (this
// caregiver becomes its first member); provided -> joins that patient's
// existing shared data instead of starting private/empty.
export async function register(
  name: string,
  email: string,
  password: string,
  inviteCode?: string,
  role: "caregiver" | "patient" = "caregiver"
): Promise<TokenResponse> {
  const body: Record<string, unknown> = { name, email, password, role };
  if (inviteCode?.trim()) {
    body.inviteCode = inviteCode.trim();
  }
  const res = await apiClient.post<TokenResponse>("/auth/register", body);
  setToken(res.accessToken);
  return res;
}

// No-password entry using just the invite code (POST /auth/patient-access).
// Meant for the patient-facing device, but also usable by a caregiver on a
// shared device who'd rather not type a password.
export async function patientAccess(inviteCode: string): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>("/auth/patient-access", {
    inviteCode: inviteCode.trim(),
  });
  setToken(res.accessToken);
  return res;
}

export function logout(): void {
  clearToken();
}
