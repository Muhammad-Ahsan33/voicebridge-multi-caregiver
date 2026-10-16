import type { Contact } from "../types";
import { apiRequest } from "./client";

export function listContacts(): Promise<Contact[]> {
  return apiRequest<Contact[]>("/contacts");
}
