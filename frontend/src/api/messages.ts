import type { Message } from "../types";
import { apiRequest } from "./client";

export function listMessages(): Promise<Message[]> {
  return apiRequest<Message[]>("/messages");
}

export function getMessage(id: string): Promise<Message> {
  return apiRequest<Message>(`/messages/${id}`);
}
