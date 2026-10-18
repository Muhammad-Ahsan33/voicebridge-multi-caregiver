import { ArrowLeft } from "lucide-react";
import type { Contact } from "../types";
import Avatar from "./Avatar";
import ProgressSteps from "./ProgressSteps";

interface Props {
  contacts: Contact[];
  onBack: () => void;
  onSelect: (contactId: string) => void;
}

export default function ContactPicker({ contacts, onBack, onSelect }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas animate-popIn">
      <header className="flex items-center gap-3 px-4 py-4">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="w-12 h-12 rounded-full bg-surface shadow-card flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-6 h-6 text-ink" />
        </button>
        <div className="flex-1">
          <ProgressSteps step={2} />
        </div>
        <div className="w-12" />
      </header>

      <h1 className="text-center text-2xl font-bold px-6 mt-2 mb-6">Who do you want to tell?</h1>

      <main className="flex-1 px-6 pb-10">
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {contacts.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="flex flex-col items-center gap-3 bg-surface rounded-card shadow-card hover:shadow-cardHover
                active:scale-[0.96] transition-all py-6 px-3"
            >
              <Avatar color={c.avatarColor} label={c.initials} imageUrl={c.avatarUrl} size="lg" />
              <div className="text-center">
                <p className="font-bold text-lg leading-tight">{c.name}</p>
                <p className="text-sm text-inkmuted">{c.relationship}</p>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
