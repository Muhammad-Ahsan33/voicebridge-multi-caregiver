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
  videoUrl?: string; // video or image shown locally for identification
  audioUrl?: string; // human-recorded audio, this is what actually gets sent
  thumbColor: string; // fallback avatar color when no visual media is uploaded yet
  initials: string; // fallback avatar initials when no visual media is uploaded yet
}

export interface Contact {
  id: string;
  name: string;
  relationship: string;
  avatarColor: string;
  initials: string;
  avatarUrl?: string | null;
  phone: string;
}

export interface SendHistoryEntry {
  id: string;
  messageId: string;
  contactId: string;
  sentAt: string;
  status: "sent" | "failed";
}

export type Screen =
  | { name: "home" }
  | { name: "preview"; messageId: string }
  | { name: "contacts"; messageId: string }
  | { name: "confirm"; messageId: string; contactId: string }
  | { name: "sent"; messageId: string; contactId: string };

// --- Caregiver-app-only addition (not part of frontend/'s types.ts) ---
export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: "caregiver" | "patient";
}

// --- Multi-caregiver / shared-patient schema change additions ---
// ASSUMPTION: exact shape of GET/PUT /patients/me wasn't provided, so this
// follows the same camelCase convention as every other response in the
// API. Adjust field names here if the real response differs.
export interface Patient {
  id: string;
  name: string;
  inviteCode: string;
}
