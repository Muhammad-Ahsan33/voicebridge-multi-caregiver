import type { Contact } from "../types";
import { apiRequest, resolveMediaUrl } from "./client";

export async function listContacts(): Promise<Contact[]> {
  const contacts = await apiRequest<Contact[]>("/contacts");
  return contacts.map((contact) => ({
    ...contact,
    avatarUrl: resolveMediaUrl(contact.avatarUrl),
  }));
}
