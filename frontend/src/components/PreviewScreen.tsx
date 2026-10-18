import { useRef, useState } from "react";
import { ArrowLeft, Volume2, CheckCircle2 } from "lucide-react";
import type { Message } from "../types";
import Avatar from "./Avatar";
import ProgressSteps from "./ProgressSteps";
import { isImageMedia } from "../utils/media";

interface Props {
  message: Message;
  onBack: () => void;
  onConfirm: () => void;
}

export default function PreviewScreen({ message, onBack, onConfirm }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const playAudio = () => {
    if (!audioRef.current) {
      // No real recording yet in this demo — just animate the affordance.
      setPlaying(true);
      setTimeout(() => setPlaying(false), 1600);
      return;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setPlaying(true);
  };

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
          <ProgressSteps step={1} />
        </div>
        <div className="w-12" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 pb-10">
        <div className="w-full max-w-sm aspect-square rounded-card overflow-hidden shadow-cardHover relative">
          {message.videoUrl ? (
            isImageMedia(message.videoUrl) ? (
              <img src={message.videoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <video
                src={message.videoUrl}
                autoPlay
                playsInline
                loop
                muted
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: message.thumbColor + "22" }}
            >
              <Avatar
                color={message.thumbColor}
                label={message.initials || message.title.trim().charAt(0).toUpperCase()}
                size="xl"
                rounded="card"
              />
            </div>
          )}
        </div>

        <button
          onClick={playAudio}
          className="flex items-center gap-3 bg-primary text-white font-bold text-xl px-6 py-4 rounded-full shadow-card active:scale-95 transition-transform"
        >
          <span className={`flex items-center justify-center ${playing ? "animate-breathe" : ""}`}>
            <Volume2 className="w-7 h-7" />
          </span>
          {message.title}
        </button>
        {message.audioUrl && <audio ref={audioRef} src={message.audioUrl} onEnded={() => setPlaying(false)} />}

        <button
          onClick={playAudio}
          className="text-inkmuted font-bold underline underline-offset-4 text-lg"
        >
          Play again
        </button>
      </main>

      <footer className="px-6 pb-8">
        <button
          onClick={onConfirm}
          className="w-full flex items-center justify-center gap-3 bg-amber hover:bg-amber-dark text-white font-bold text-xl py-5 rounded-full shadow-cardHover active:scale-[0.98] transition-all"
        >
          <CheckCircle2 className="w-7 h-7" />
          Yes, send this message
        </button>
      </footer>
    </div>
  );
}
