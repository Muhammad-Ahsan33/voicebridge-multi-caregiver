import { Play } from "lucide-react";
import type { Message } from "../types";
import Avatar from "./Avatar";
import { isImageMedia } from "../utils/media";

interface Props {
  message: Message;
  onSelect: (id: string) => void;
}

export default function MessageCard({ message, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(message.id)}
      aria-label={message.title}
      className="group relative flex flex-col items-stretch bg-surface rounded-card shadow-card
        hover:shadow-cardHover active:scale-[0.97] transition-all overflow-hidden text-left"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        {message.videoUrl ? (
          isImageMedia(message.videoUrl) ? (
            <img src={message.videoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <video
              src={message.videoUrl}
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: message.thumbColor + "22" }}>
            <Avatar
              color={message.thumbColor}
              label={message.initials || message.title.trim().charAt(0).toUpperCase()}
              size="xl"
              rounded="card"
            />
          </div>
        )}

        {/* Play affordance — breathes gently to invite a tap, no reading required */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-breathe w-14 h-14 rounded-full bg-white/85 shadow-card flex items-center justify-center">
            <Play className="w-7 h-7 text-primary-dark ml-1" fill="currentColor" />
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <p className="font-bold text-lg leading-snug text-ink">{message.title}</p>
      </div>
    </button>
  );
}
