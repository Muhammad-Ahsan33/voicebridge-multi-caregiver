import { Loader2, RefreshCw, WifiOff } from "lucide-react";

export function LoadingScreen({ label = "Loading your messages…" }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-canvas">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-inkmuted font-bold text-lg">{label}</p>
    </div>
  );
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-emergency-light flex items-center justify-center">
        <WifiOff className="w-8 h-8 text-emergency" />
      </div>
      <p className="text-xl font-bold">Couldn't load your messages</p>
      <p className="text-inkmuted">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-full shadow-card
          active:scale-95 transition-transform"
      >
        <RefreshCw className="w-5 h-5" />
        Try again
      </button>
    </div>
  );
}
