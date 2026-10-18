import { CheckCircle2, Home, MessageCircle } from "lucide-react";
import type { Contact, Message } from "../types";

interface Props {
  message: Message;
  contact: Contact;
  whatsappUrl: string | null;
  onDone: () => void;
}

export default function SentScreen({ message, contact, whatsappUrl, onDone }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-canvas px-6 animate-popIn">
      <div className="w-24 h-24 rounded-full bg-sage-light flex items-center justify-center animate-popIn">
        <CheckCircle2 className="w-14 h-14 text-sage" />
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold">Ready to send!</p>
        <p className="text-inkmuted text-lg mt-1">
          "{message.title}" for {contact.name}
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-sage text-white font-bold text-lg py-4 rounded-full shadow-cardHover active:scale-95 transition-transform"
          >
            <MessageCircle className="w-5 h-5" />
            Open WhatsApp
          </a>
        )}

        <button
          onClick={onDone}
          className="flex items-center justify-center gap-2 bg-primary text-white font-bold text-lg py-4 rounded-full shadow-cardHover active:scale-95 transition-transform"
        >
          <Home className="w-5 h-5" />
          Back to messages
        </button>
      </div>
    </div>
  );
}
