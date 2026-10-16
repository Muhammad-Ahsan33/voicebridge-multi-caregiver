import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CategoryPicker, { CATEGORIES } from "../components/CategoryPicker";
import RecorderWidget from "../components/RecorderWidget";
import { useToast } from "../components/Toast";
import * as messagesApi from "../api/messages";
import type { CategoryId, Message } from "../types";
import { ApiError } from "../api/client";

export default function MessageFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [message, setMessage] = useState<Message | null>(null);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId>("people");
  const [thumbColor, setThumbColor] = useState(CATEGORIES[0].colorHex);
  const [initials, setInitials] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const m = await messagesApi.getMessage(id!);
        setMessage(m);
        setTitle(m.title);
        setCategoryId(m.categoryId);
        setThumbColor(m.thumbColor);
        setInitials(m.initials);
      } catch {
        showToast("Couldn't load that message.", "error");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Give the message a title.");
      return;
    }
    if (!initials.trim()) {
      setError("Add a short fallback label (initials or an emoji).");
      return;
    }

    setSaving(true);
    try {
      const input = { title: title.trim(), categoryId, thumbColor, initials: initials.trim() };
      const saved = isNew
        ? await messagesApi.createMessage(input)
        : await messagesApi.updateMessage(message!.id, input);
      setMessage(saved);
      showToast(isNew ? "Message created. Now add video and audio." : "Message saved.");
      if (isNew) {
        navigate(`/messages/${saved.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadVideo(file: File) {
    const updated = await messagesApi.uploadVideo(message!.id, file);
    setMessage(updated);
    showToast("Video uploaded.");
  }

  async function handleUploadAudio(file: File) {
    const updated = await messagesApi.uploadAudio(message!.id, file);
    setMessage(updated);
    showToast("Audio uploaded.");
  }

  if (loading) {
    return <div className="p-8 text-sm text-inkmuted">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-canvas px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-inkmuted hover:text-primary"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <h1 className="text-xl font-semibold text-ink">{isNew ? "Add message" : "Edit message"}</h1>

        <form onSubmit={handleSave} className="mt-6 space-y-5 rounded-card bg-surface p-6 shadow-card">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-ink">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How is Ahmed?"
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-ink">Category</span>
            <div className="mt-2">
              <CategoryPicker value={categoryId} onChange={setCategoryId} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="thumbColor" className="block text-sm font-medium text-ink">
                Fallback color
              </label>
              <input
                id="thumbColor"
                type="color"
                value={thumbColor}
                onChange={(e) => setThumbColor(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-ink/15"
              />
            </div>
            <div>
              <label htmlFor="initials" className="block text-sm font-medium text-ink">
                Fallback initials / emoji
              </label>
              <input
                id="initials"
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                maxLength={3}
                placeholder="A"
                className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-emergency">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : isNew ? "Create message" : "Save changes"}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <RecorderWidget
            kind="video"
            label="Video — so the patient can recognize the message"
            helperText="Plays locally to confirm what the card means. It's never sent anywhere."
            currentUrl={message?.videoUrl}
            disabled={!message}
            disabledReason="Create the message above first, then record or upload a video."
            onUpload={handleUploadVideo}
          />
          <RecorderWidget
            kind="audio"
            label="Audio — what actually gets sent"
            helperText="This is the clip that gets delivered to the contact when the patient sends this message."
            currentUrl={message?.audioUrl}
            disabled={!message}
            disabledReason="Create the message above first, then record or upload audio."
            onUpload={handleUploadAudio}
          />
        </div>
      </div>
    </div>
  );
}
