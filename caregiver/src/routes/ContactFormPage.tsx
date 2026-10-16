import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "../components/Toast";
import * as contactsApi from "../api/contacts";
import { ApiError } from "../api/client";

// Loose E.164-ish check: "+" followed by 7-15 digits. Matches what Phase 6's
// WhatsApp integration will expect.
const PHONE_PATTERN = /^\+\d{7,15}$/;

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
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      } catch {
        showToast("Couldn't load that contact.", "error");
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
    if (!name.trim()) return setError("Add a name.");
    if (!relationship.trim()) return setError('Add a relationship, e.g. "Family".');
    if (!PHONE_PATTERN.test(phone.trim())) {
      return setError("Phone must be in international format, e.g. +923001234567.");
    }
    if (!initials.trim()) return setError("Add initials for the fallback avatar.");

    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        relationship: relationship.trim(),
        phone: phone.trim(),
        avatarColor,
        initials: initials.trim(),
      };
      if (isNew) {
        await contactsApi.createContact(input);
        showToast("Contact created.");
      } else {
        await contactsApi.updateContact(id!, input);
        showToast("Contact saved.");
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
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
                Initials
              </label>
              <input
                id="initials"
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                maxLength={2}
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
            {saving ? "Saving…" : isNew ? "Create contact" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
