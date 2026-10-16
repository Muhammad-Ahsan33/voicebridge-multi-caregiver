import type { SendHistoryEntry } from "../types";
import { apiRequest } from "./client";

export function sendMessage(messageId: string, contactId: string): Promise<SendHistoryEntry> {
  return apiRequest<SendHistoryEntry>(`/messages/${messageId}/send`, {
    method: "POST",
    body: { contactId },
  });
}
