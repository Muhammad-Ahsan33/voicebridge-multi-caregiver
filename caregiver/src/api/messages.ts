import { apiClient } from "./client";
import type { CategoryId, Message } from "../types";

export type MessageInput = {
  title: string;
  categoryId: CategoryId;
  thumbColor: string;
};

export function listMessages(category?: CategoryId): Promise<Message[]> {
  const query = category ? `?category=${category}` : "";
  return apiClient.get<Message[]>(`/messages${query}`);
}

export function getMessage(id: string): Promise<Message> {
  return apiClient.get<Message>(`/messages/${id}`);
}

export function createMessage(input: MessageInput): Promise<Message> {
  return apiClient.post<Message>("/messages", input);
}

export function updateMessage(id: string, input: Partial<MessageInput>): Promise<Message> {
  return apiClient.put<Message>(`/messages/${id}`, input);
}

export function deleteMessage(id: string): Promise<void> {
  return apiClient.delete<void>(`/messages/${id}`);
}

// Field name "file" matches the backend's UploadFile parameter name
// (see backend/app/routers/messages.py upload_video/upload_audio).
export function uploadVideo(id: string, file: File): Promise<Message> {
  const form = new FormData();
  form.append("file", file);
  return apiClient.postForm<Message>(`/messages/${id}/upload-video`, form);
}

export function uploadAudio(id: string, file: File): Promise<Message> {
  const form = new FormData();
  form.append("file", file);
  return apiClient.postForm<Message>(`/messages/${id}/upload-audio`, form);
}
