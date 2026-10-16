import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, Mic, Upload, RotateCcw, Check, Loader2 } from "lucide-react";

type Kind = "video" | "audio";

// Mirrors backend/app/routers/messages.py's ALLOWED_VIDEO_TYPES / ALLOWED_AUDIO_TYPES
// and max_video_bytes / max_audio_bytes, so we can reject bad files before a
// network round trip instead of after one.
const ALLOWED_TYPES: Record<Kind, string[]> = {
  video: ["video/mp4", "video/webm", "video/quicktime"],
  audio: ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/x-wav", "audio/webm", "audio/ogg"],
};
const MAX_BYTES: Record<Kind, number> = {
  video: 25 * 1024 * 1024,
  audio: 8 * 1024 * 1024,
};
// Short identification/message clips, not long recordings (matches the
// "3-5 second clip" example from the original project brief).
const MAX_SECONDS: Record<Kind, number> = {
  video: 8,
  audio: 6,
};

type Stage = "idle" | "permission" | "requesting" | "recording" | "preview" | "uploading" | "denied";

interface RecorderWidgetProps {
  kind: Kind;
  label: string;
  helperText: string;
  currentUrl?: string;
  disabled?: boolean;
  disabledReason?: string;
  onUpload: (file: File) => Promise<void>;
}

export default function RecorderWidget({
  kind,
  label,
  helperText,
  currentUrl,
  disabled,
  disabledReason,
  onUpload,
}: RecorderWidgetProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS[kind]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function validate(file: File): string | null {
    const contentType = file.type.split(";", 1)[0].trim().toLowerCase();
    if (!ALLOWED_TYPES[kind].includes(contentType)) {
      return `That file type (${file.type || "unknown"}) isn't supported. Use: ${ALLOWED_TYPES[kind].join(", ")}.`;
    }
    if (file.size === 0) {
      return "That file looks empty — try a different one.";
    }
    if (file.size > MAX_BYTES[kind]) {
      return `That file is too large. Max ${Math.round(MAX_BYTES[kind] / (1024 * 1024))}MB.`;
    }
    return null;
  }

  function pickSupportedMime(candidates: string[]): string | undefined {
    if (typeof MediaRecorder === "undefined") return undefined;
    return candidates.find((c) => MediaRecorder.isTypeSupported(c));
  }

  // Step 1 of 2: show the plain-language explanation *before* the browser's
  // native permission prompt fires (per Phase 4 spec Section 4).
  function requestPermissionStage() {
    setError(null);
    setStage("permission");
  }

  // Step 2 of 2: caregiver confirmed — now actually call getUserMedia.
  async function beginRecording() {
    setStage("requesting");
    try {
      const constraints: MediaStreamConstraints =
        kind === "video" ? { video: true, audio: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (kind === "video" && liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        await liveVideoRef.current.play().catch(() => {});
      }

      const mimeType =
        kind === "video"
          ? pickSupportedMime(["video/webm;codecs=vp8,opus", "video/webm"])
          : pickSupportedMime(["audio/webm;codecs=opus", "audio/webm"]);
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || (kind === "video" ? "video/webm" : "audio/webm"),
        });
        const file = new File([blob], `${kind}-clip.webm`, { type: blob.type });
        stopStream();
        const validationError = validate(file);
        if (validationError) {
          setError(validationError);
          setStage("idle");
          return;
        }
        setPendingFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setStage("preview");
      };

      recorderRef.current = recorder;
      recorder.start();
      setStage("recording");
      setSecondsLeft(MAX_SECONDS[kind]);
      timerRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            recorder.stop();
            if (timerRef.current) window.clearInterval(timerRef.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch {
      stopStream();
      setStage("denied");
      setError(
        kind === "video"
          ? "We couldn't access your camera or microphone. You can still upload a video file below."
          : "We couldn't access your microphone. You can still upload an audio file below."
      );
    }
  }

  function stopRecordingEarly() {
    recorderRef.current?.stop();
    if (timerRef.current) window.clearInterval(timerRef.current);
  }

  function reRecord() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
    setError(null);
    setStage("idle");
  }

  function handleFileChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStage("preview");
  }

  async function confirmUpload() {
    if (!pendingFile) return;
    setStage("uploading");
    setError(null);
    try {
      await onUpload(pendingFile);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPendingFile(null);
      setStage("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Try again.");
      setStage("preview");
    }
  }

  const Icon = kind === "video" ? Camera : Mic;

  return (
    <div className="rounded-card border border-primary/10 bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2 text-ink">
        <Icon size={18} className="text-primary" />
        <h3 className="font-semibold">{label}</h3>
      </div>
      <p className="mt-1 text-sm text-inkmuted">{helperText}</p>

      {disabled ? (
        <p className="mt-4 rounded-lg bg-canvas px-3 py-2 text-sm text-inkmuted">
          {disabledReason ?? "Save the message's basic details first to enable this."}
        </p>
      ) : (
        <div className="mt-4">
          {currentUrl && stage === "idle" && (
            <div className="mb-3">
              {kind === "video" ? (
                <video src={currentUrl} controls className="w-full max-w-xs rounded-lg" />
              ) : (
                <audio src={currentUrl} controls className="w-full max-w-xs" />
              )}
              <p className="mt-1 text-xs text-inkmuted">
                Current {kind}. Record or upload a new one to replace it.
              </p>
            </div>
          )}

          {stage === "idle" && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={requestPermissionStage}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-dark"
              >
                <Icon size={16} /> Record {kind}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-primary/30 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Upload size={16} /> Upload file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES[kind].join(",")}
                className="hidden"
                onChange={handleFileChosen}
              />
            </div>
          )}

          {stage === "permission" && (
            <div className="space-y-3 rounded-lg bg-primary-light px-4 py-3">
              <p className="text-sm text-primary-dark">
                {kind === "video"
                  ? "We need your camera and microphone to record a short video message. Your browser will ask you to allow this next."
                  : "We need your microphone to record a short audio message. Your browser will ask you to allow this next."}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStage("idle")}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-inkmuted hover:bg-white/50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={beginRecording}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {stage === "requesting" && (
            <div className="flex items-center gap-2 text-sm text-inkmuted">
              <Loader2 size={16} className="animate-spin" /> Waiting for permission…
            </div>
          )}

          {stage === "recording" && (
            <div className="space-y-3">
              {kind === "video" && (
                <video ref={liveVideoRef} muted playsInline className="w-full max-w-xs rounded-lg bg-ink" />
              )}
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 animate-pulse rounded-full bg-emergency" aria-hidden="true" />
                <span className="text-sm font-medium text-ink">Recording… {secondsLeft}s left</span>
                <button
                  type="button"
                  onClick={stopRecordingEarly}
                  className="ml-auto rounded-lg border border-ink/20 px-3 py-1.5 text-sm font-medium text-ink hover:bg-canvas"
                >
                  Stop now
                </button>
              </div>
            </div>
          )}

          {stage === "preview" && previewUrl && (
            <div className="space-y-3">
              {kind === "video" ? (
                <video src={previewUrl} controls className="w-full max-w-xs rounded-lg" />
              ) : (
                <audio src={previewUrl} controls className="w-full max-w-xs" />
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={reRecord}
                  className="inline-flex items-center gap-2 rounded-lg border border-ink/20 px-4 py-2 text-sm font-medium text-ink hover:bg-canvas"
                >
                  <RotateCcw size={16} /> Re-record
                </button>
                <button
                  type="button"
                  onClick={confirmUpload}
                  className="inline-flex items-center gap-2 rounded-lg bg-sage px-4 py-2 text-sm font-semibold text-white hover:bg-sage/90"
                >
                  <Check size={16} /> Use this {kind}
                </button>
              </div>
            </div>
          )}

          {stage === "uploading" && (
            <div className="flex items-center gap-2 text-sm text-inkmuted">
              <Loader2 size={16} className="animate-spin" /> Uploading…
            </div>
          )}

          {stage === "denied" && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-primary/30 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light"
              >
                <Upload size={16} /> Upload file instead
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES[kind].join(",")}
                className="hidden"
                onChange={handleFileChosen}
              />
            </div>
          )}

          {error && <p className="mt-3 text-sm font-medium text-emergency">{error}</p>}
        </div>
      )}
    </div>
  );
}
