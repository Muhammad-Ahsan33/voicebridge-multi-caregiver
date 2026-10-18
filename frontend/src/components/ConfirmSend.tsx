import { ArrowLeft, Volume2, Send, Loader2, AlertTriangle } from "lucide-react";
import type { Contact, Message } from "../types";
import Avatar from "./Avatar";
import ProgressSteps from "./ProgressSteps";

interface Props {
  message: Message;
  contact: Contact;
  onBack: () => void;
  onCancel: () => void;
  onSend: () => void;
  sending?: boolean;
  error?: string | null;
}

export default function ConfirmSend({ message, contact, onBack, onCancel, onSend, sending = false, error = null }: Props) {
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
          <ProgressSteps step={3} />
        </div>
        <div className="w-12" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-6 pb-10">
        <p className="text-2xl font-bold text-center">Send this message?</p>

        <div className="bg-surface rounded-card shadow-card px-6 py-5 flex items-center gap-3 max-w-sm w-full">
          <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <Volume2 className="w-6 h-6 text-primary-dark" />
          </div>
          <p className="font-bold text-lg text-ink">{message.title}</p>
        </div>

        <div className="flex items-center gap-2 text-inkmuted font-bold">
          <span>to</span>
        </div>

        <div className="flex items-center gap-3 bg-surface rounded-full shadow-card px-5 py-3">
          <Avatar color={contact.avatarColor} label={contact.initials} imageUrl={contact.avatarUrl} size="md" />
          <p className="font-bold text-lg">{contact.name}</p>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 bg-emergency-light text-emergency font-bold px-4 py-3 rounded-xl max-w-sm text-center">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </main>

      <footer className="px-6 pb-8 flex gap-3 max-w-sm w-full mx-auto">
        <button
          onClick={onCancel}
          disabled={sending}
          className="flex-1 bg-surface text-ink font-bold text-lg py-5 rounded-full shadow-card active:scale-[0.97] transition-transform disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          onClick={onSend}
          disabled={sending}
          className="flex-[1.4] flex items-center justify-center gap-2 bg-sage text-white font-bold text-lg py-5 rounded-full shadow-cardHover active:scale-[0.97] transition-transform disabled:opacity-70"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {sending ? "Sending…" : "Send"}
        </button>
      </footer>
    </div>
  );
}
