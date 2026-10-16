import type { Message } from "../types";
import MessageCard from "./MessageCard";

interface Props {
  messages: Message[];
  onSelect: (id: string) => void;
}

export default function CardGrid({ messages, onSelect }: Props) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 gap-3">
        <span className="text-5xl" aria-hidden="true">
          🗂️
        </span>
        <p className="text-xl font-bold text-inkmuted">No messages here yet</p>
        <p className="text-inkmuted">A caregiver can add one from the caregiver panel.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
      {messages.map((m) => (
        <MessageCard key={m.id} message={m} onSelect={onSelect} />
      ))}
    </div>
  );
}
