import { apiRequest } from "./client";

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface PatientInfo {
  id: string;
  name: string;
  inviteCode: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  patient: PatientInfo;
  user: DashboardUser | null;
}

export function login(email: string, password: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    skipAuth: true,
  });
}

// No-password entry for the patient-facing device — whoever has the
// invite code (shared by any caregiver) gets access to that patient's
// shared messages/contacts. This is how the primary user's own device
// gets in without needing an individual caregiver's email/password.
export function patientAccess(inviteCode: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/auth/patient-access", {
    method: "POST",
    body: { inviteCode },
    skipAuth: true,
  });
}
