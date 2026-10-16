import { apiClient } from "./client";
import type { Contact } from "../types";

export type ContactInput = {
  name: string;
  relationship: string;
  avatarColor: string;
  initials: string;
  phone: string;
};

export function listContacts(): Promise<Contact[]> {
  return apiClient.get<Contact[]>("/contacts");
}

export function createContact(input: ContactInput): Promise<Contact> {
  return apiClient.post<Contact>("/contacts", input);
}

export function updateContact(id: string, input: Partial<ContactInput>): Promise<Contact> {
  return apiClient.put<Contact>(`/contacts/${id}`, input);
}

export function deleteContact(id: string): Promise<void> {
  return apiClient.delete<void>(`/contacts/${id}`);
}
