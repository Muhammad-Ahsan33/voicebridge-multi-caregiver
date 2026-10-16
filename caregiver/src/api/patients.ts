import { apiClient } from "./client";
import type { Patient } from "../types";

// ASSUMPTION: response/request shapes follow the same camelCase convention
// as the rest of the API. Confirm against the real backend if this differs.
export function getPatient(): Promise<Patient> {
  return apiClient.get<Patient>("/patients/me");
}

export function updatePatient(input: { name: string }): Promise<Patient> {
  return apiClient.put<Patient>("/patients/me", input);
}
