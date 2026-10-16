export type CategoryId =
  | "people"
  | "needs"
  | "questions"
  | "actions"
  | "emergency";

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  colorClass: string; // tailwind bg utility for the category chip
}

export interface Message {
  id: string;
  title: string; // written label, kept minimal — video/audio carry the meaning
  categoryId: CategoryId;
  videoUrl?: string; // human-recorded clip, plays locally for identification
  audioUrl?: string; // human-recorded audio, this is what actually gets sent
  thumbColor: string; // fallback avatar color when no video is uploaded yet
  initials: string; // fallback avatar initials when no video is uploaded yet
}

export interface Contact {
  id: string;
  name: string;
  relationship: string;
  avatarColor: string;
  initials: string;
  phone: string;
}

export interface SendHistoryEntry {
  id: string;
  messageId: string;
  contactId: string;
  sentAt: string;
  status: "sent" | "failed";
  // Present on the response to POST /messages/{id}/send:
  audioUrl?: string | null; // long-lived link to the AUDIO only
  whatsappUrl?: string | null; // wa.me link addressed to the chosen contact
}

export type Screen =
  | { name: "home" }
  | { name: "preview"; messageId: string }
  | { name: "contacts"; messageId: string }
  | { name: "confirm"; messageId: string; contactId: string }
  | { name: "sent"; messageId: string; contactId: string };
