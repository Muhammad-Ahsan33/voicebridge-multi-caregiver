import type { Category, Contact, Message } from "../types";

export const categories: Category[] = [
  { id: "people", label: "People", emoji: "🧑‍🤝‍🧑", colorClass: "bg-primary-light text-primary-dark" },
  { id: "needs", label: "Basic Needs", emoji: "💧", colorClass: "bg-sage-light text-sage" },
  { id: "questions", label: "Questions", emoji: "❓", colorClass: "bg-amber-light text-amber-dark" },
  { id: "actions", label: "Actions", emoji: "🎬", colorClass: "bg-primary-light text-primary-dark" },
  { id: "emergency", label: "Emergency", emoji: "🚨", colorClass: "bg-emergency-light text-emergency" },
];

export const messages: Message[] = [
  // People
  { id: "m1", title: "How is Ahmed?", categoryId: "people", thumbColor: "#2D6E8E", initials: "A" },
  { id: "m2", title: "Call Ahmed", categoryId: "people", thumbColor: "#2D6E8E", initials: "A" },
  { id: "m3", title: "Where is Ahmed?", categoryId: "people", thumbColor: "#2D6E8E", initials: "A" },
  { id: "m4", title: "Thank Ahmed", categoryId: "people", thumbColor: "#2D6E8E", initials: "A" },

  // Basic Needs
  { id: "m5", title: "I need water", categoryId: "needs", thumbColor: "#5C8A72", initials: "💧" },
  { id: "m6", title: "I need food", categoryId: "needs", thumbColor: "#5C8A72", initials: "🍽" },
  { id: "m7", title: "I need medicine", categoryId: "needs", thumbColor: "#5C8A72", initials: "💊" },
  { id: "m8", title: "I am tired", categoryId: "needs", thumbColor: "#5C8A72", initials: "😴" },
  { id: "m9", title: "I want to sleep", categoryId: "needs", thumbColor: "#5C8A72", initials: "🛏" },
  { id: "m10", title: "I need help", categoryId: "needs", thumbColor: "#5C8A72", initials: "🤲" },

  // Questions
  { id: "m11", title: "How are you?", categoryId: "questions", thumbColor: "#E8A23D", initials: "?" },
  { id: "m12", title: "Where are you?", categoryId: "questions", thumbColor: "#E8A23D", initials: "?" },
  { id: "m13", title: "What are you doing?", categoryId: "questions", thumbColor: "#E8A23D", initials: "?" },
  { id: "m14", title: "When are you coming?", categoryId: "questions", thumbColor: "#E8A23D", initials: "?" },

  // Actions
  { id: "m15", title: "Call my mother", categoryId: "actions", thumbColor: "#2D6E8E", initials: "📞" },
  { id: "m16", title: "Take me home", categoryId: "actions", thumbColor: "#2D6E8E", initials: "🏠" },
  { id: "m17", title: "Open the door", categoryId: "actions", thumbColor: "#2D6E8E", initials: "🚪" },
  { id: "m18", title: "Turn on the TV", categoryId: "actions", thumbColor: "#2D6E8E", initials: "📺" },

  // Emergency
  { id: "m19", title: "I need help", categoryId: "emergency", thumbColor: "#D96459", initials: "🚨" },
  { id: "m20", title: "Call the doctor", categoryId: "emergency", thumbColor: "#D96459", initials: "⚕" },
  { id: "m21", title: "Call an ambulance", categoryId: "emergency", thumbColor: "#D96459", initials: "🚑" },
  { id: "m22", title: "I am in pain", categoryId: "emergency", thumbColor: "#D96459", initials: "⚠" },
];

export const contacts: Contact[] = [
  { id: "c1", name: "Mother", relationship: "Family", avatarColor: "#2D6E8E", initials: "M", phone: "+923001234567" },
  { id: "c2", name: "Brother", relationship: "Family", avatarColor: "#5C8A72", initials: "B", phone: "+923007654321" },
  { id: "c3", name: "Ahmed", relationship: "Friend", avatarColor: "#E8A23D", initials: "A", phone: "+923009998888" },
  { id: "c4", name: "Doctor", relationship: "Care team", avatarColor: "#D96459", initials: "D", phone: "+923005556666" },
];
