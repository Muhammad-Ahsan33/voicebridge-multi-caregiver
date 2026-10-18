import { apiClient, resolveMediaUrl } from "./client";
import type { Contact } from "../types";

export type ContactInput = {
  name: string;
  relationship: string;
  avatarColor: string;
  initials: string;
  phone: string;
};

function withResolvedAvatar(contact: Contact): Contact {
  return { ...contact, avatarUrl: resolveMediaUrl(contact.avatarUrl) };
}

export async function listContacts(): Promise<Contact[]> {
  const contacts = await apiClient.get<Contact[]>("/contacts");
  return contacts.map(withResolvedAvatar);
}

export async function createContact(input: ContactInput): Promise<Contact> {
  return withResolvedAvatar(await apiClient.post<Contact>("/contacts", input));
}

export async function updateContact(id: string, input: Partial<ContactInput>): Promise<Contact> {
  return withResolvedAvatar(await apiClient.put<Contact>(`/contacts/${id}`, input));
}

export async function uploadContactAvatar(id: string, file: File): Promise<Contact> {
  const form = new FormData();
  form.append("file", file);
  return withResolvedAvatar(await apiClient.postForm<Contact>(`/contacts/${id}/upload-avatar`, form));
}

export function deleteContact(id: string): Promise<void> {
  return apiClient.delete<void>(`/contacts/${id}`);
}
