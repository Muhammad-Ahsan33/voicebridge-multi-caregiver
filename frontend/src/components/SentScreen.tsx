import { useState } from "react";
import { CheckCircle2, Home, MessageCircle, Paperclip, Loader2 } from "lucide-react";
import type { Contact, Message } from "../types";

interface Props {
  message: Message;
  contact: Contact;
  whatsappUrl: string | null;
  audioUrl: string | null;
  onDone: () => void;
}

export default function SentScreen({ message, contact, whatsappUrl, audioUrl, onDone }: Props) {
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Attaching the real audio file needs the Web Share API with files
  // (works in mobile Chrome/Safari). Feature-detect so we only show it where it works.
  const canShareFiles =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof File !== "undefined" &&
    navigator.canShare({ files: [new File([""], "x.mp3", { type: "audio/mpeg" })] });

  const shareAudioFile = async () => {
    if (!audioUrl) return;
    setSharing(true);
    setShareError(null);
    try {
      const res = await fetch(audioUrl);
      const blob = await res.blob();
      const ext = blob.type.includes("mp4") || blob.type.includes("m4a") ? "m4a"
        : blob.type.includes("webm") ? "webm"
        : blob.type.includes("ogg") ? "ogg"
        : blob.type.includes("wav") ? "wav" : "mp3";
      const file = new File([blob], `${message.title}.${ext}`, { type: blob.type || "audio/mpeg" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: message.title });
      } else {
        setShareError("This device can't share audio files directly.");
      }
    } catch (err) {
      // User cancelling the share sheet throws AbortError — not a real error.
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setShareError("Couldn't attach the audio. Use the WhatsApp button instead.");
      }
    } finally {
      setSharing(false);
    }
  };

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

        {canShareFiles && audioUrl && (
          <button
            onClick={shareAudioFile}
            disabled={sharing}
            className="flex items-center justify-center gap-2 bg-surface text-ink font-bold text-lg py-4 rounded-full shadow-card active:scale-95 transition-transform disabled:opacity-60"
          >
            {sharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            Send audio file instead
          </button>
        )}

        {shareError && (
          <p role="alert" className="text-emergency font-bold text-sm text-center">{shareError}</p>
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
