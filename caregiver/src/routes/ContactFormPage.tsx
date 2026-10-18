import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { useToast } from "../components/Toast";
import Avatar from "../components/Avatar";
import * as contactsApi from "../api/contacts";
import { ApiError } from "../api/client";
import type { Contact } from "../types";

// Loose E.164-ish check: "+" followed by 7-15 digits. Matches what Phase 6's
// WhatsApp integration will expect.
const PHONE_PATTERN = /^\+\d{7,15}$/;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ContactFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarColor, setAvatarColor] = useState("#2D6E8E");
  const [initials, setInitials] = useState("");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savedContactId, setSavedContactId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        // No GET /contacts/{id} endpoint exists (Phase 2 spec only defines
        // list/create/update/delete for contacts), so we find it in the list.
        const contacts = await contactsApi.listContacts();
        const c = contacts.find((x) => x.id === id);
        if (!c) throw new Error("not found");
        setName(c.name);
        setRelationship(c.relationship);
        setPhone(c.phone);
        setAvatarColor(c.avatarColor);
        setInitials(c.initials);
        setAvatarPreviewUrl(c.avatarUrl ?? null);
      } catch {
        showToast("Couldn't load that contact.", "error");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleAvatarSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type.toLowerCase())) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Contact photos must be 5MB or smaller.");
      return;
    }
    setError(null);
    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Add a name.");
    if (!relationship.trim()) return setError('Add a relationship, e.g. "Family".');
    if (!PHONE_PATTERN.test(phone.trim())) {
      return setError("Phone must be in international format, e.g. +923001234567.");
    }

    setSaving(true);
    let contactSaved = false;
    try {
      const fallbackInitials =
        initials.trim() ||
        name
          .trim()
          .split(/\s+/)
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
      const input = {
        name: name.trim(),
        relationship: relationship.trim(),
        phone: phone.trim(),
        avatarColor,
        initials: fallbackInitials,
      };
      const contactId = (isNew ? savedContactId : id) ?? null;
      let contact: Contact;
      if (contactId) {
        contact = await contactsApi.updateContact(contactId, input);
      } else {
        contact = await contactsApi.createContact(input);
        setSavedContactId(contact.id);
      }
      contactSaved = true;
      if (avatarFile) {
        await contactsApi.uploadContactAvatar(contact.id, avatarFile);
      }
      if (!contactId) {
        showToast("Contact created.");
      } else {
        showToast("Contact saved.");
      }
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't save. Try again.";
      setError(contactSaved ? `Contact details were saved, but the photo upload failed: ${message}` : message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-sm text-inkmuted">Loading…</div>;

  return (
    <div className="min-h-screen bg-canvas px-6 py-8">
      <div className="mx-auto max-w-lg">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-inkmuted hover:text-primary"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <h1 className="text-xl font-semibold text-ink">{isNew ? "Add contact" : "Edit contact"}</h1>

        <form onSubmit={handleSave} className="mt-6 space-y-5 rounded-card bg-surface p-6 shadow-card">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>
          <div>
            <label htmlFor="relationship" className="block text-sm font-medium text-ink">
              Relationship
            </label>
            <input
              id="relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="Family, Care team…"
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-ink">
              Phone (WhatsApp number)
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+923001234567"
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="avatarColor" className="block text-sm font-medium text-ink">
                Avatar color
              </label>
              <input
                id="avatarColor"
                type="color"
                value={avatarColor}
                onChange={(e) => setAvatarColor(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-ink/15"
              />
            </div>
            <div>
              <label htmlFor="initials" className="block text-sm font-medium text-ink">
                Fallback initials
              </label>
              <input
                id="initials"
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                maxLength={2}
                placeholder="From name if blank"
                className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
          </div>
          <div>
            <span className="block text-sm font-medium text-ink">Contact photo</span>
            <div className="mt-2 flex items-center gap-4">
              <Avatar
                color={avatarColor}
                initials={initials || name.trim().charAt(0).toUpperCase()}
                imageUrl={avatarPreviewUrl}
                size={72}
              />
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary/30 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light">
                <Upload size={16} /> Choose image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelected}
                  className="sr-only"
                />
              </label>
              <span className="text-xs text-inkmuted">JPG, PNG, or WebP; max 5MB</span>
            </div>
          </div>
          {error && <p className="text-sm font-medium text-emergency">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : isNew ? "Create contact" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
