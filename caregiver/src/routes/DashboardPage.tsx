import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, LogOut, CheckCircle2, AlertTriangle, Copy, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import Avatar from "../components/Avatar";
import { CATEGORIES } from "../components/CategoryPicker";
import * as messagesApi from "../api/messages";
import * as contactsApi from "../api/contacts";
import * as patientsApi from "../api/patients";
import type { Message, Contact, CategoryId, Patient } from "../types";
import { ApiError } from "../api/client";
import { isImageMedia } from "../utils/media";

type Tab = "messages" | "contacts";
type DeleteTarget =
  | { type: "message"; id: string; label: string }
  | { type: "contact"; id: string; label: string };

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("messages");
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | "all">("all");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [m, c] = await Promise.all([messagesApi.listMessages(), contactsApi.listContacts()]);
      setMessages(m);
      setContacts(c);
    } catch (err) {
      // A 401 already redirects to /login inside api/client.ts — no need
      // to also toast here in that case.
      if (!(err instanceof ApiError && err.status === 401)) {
        showToast("Couldn't load your data. Try refreshing.", "error");
      }
    } finally {
      setLoading(false);
    }
    // Kept separate from messages/contacts: if /patients/me isn't reachable
    // for any reason, that shouldn't block the rest of the dashboard.
    try {
      const p = await patientsApi.getPatient();
      setPatient(p);
    } catch {
      // Silently skip the "Share access" card rather than erroring the
      // whole dashboard over one optional panel.
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "message") {
        await messagesApi.deleteMessage(deleteTarget.id);
        setMessages((m) => m.filter((msg) => msg.id !== deleteTarget.id));
        showToast("Message deleted.");
      } else {
        await contactsApi.deleteContact(deleteTarget.id);
        setContacts((c) => c.filter((ct) => ct.id !== deleteTarget.id));
        showToast("Contact deleted.");
      }
    } catch {
      showToast("Couldn't delete. Try again.", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  const filteredMessages =
    categoryFilter === "all" ? messages : messages.filter((m) => m.categoryId === categoryFilter);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-ink/10 bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">VoiceBridge Caregiver</h1>
            {user && <p className="text-sm text-inkmuted">Signed in as {user.name}</p>}
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-inkmuted hover:bg-canvas"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {patient && <PatientAccessCard patient={patient} onSaved={setPatient} />}

        <div className="mb-6 flex gap-2 border-b border-ink/10">
          {(["messages", "contacts"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold capitalize transition ${
                tab === t ? "border-b-2 border-primary text-primary" : "text-inkmuted hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "messages" && (
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <FilterChip active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")}>
                  All
                </FilterChip>
                {CATEGORIES.map((c) => (
                  <FilterChip key={c.id} active={categoryFilter === c.id} onClick={() => setCategoryFilter(c.id)}>
                    {c.emoji} {c.label}
                  </FilterChip>
                ))}
              </div>
              <Link
                to="/messages/new"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <Plus size={16} /> Add message
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-inkmuted">Loading messages…</p>
            ) : filteredMessages.length === 0 ? (
              <EmptyState message="No messages yet." actionLabel="Add your first message" to="/messages/new" />
            ) : (
              <div className="overflow-hidden rounded-card border border-ink/10 bg-surface shadow-card">
                <table className="w-full text-left text-sm">
                  <thead className="bg-canvas text-xs uppercase tracking-wide text-inkmuted">
                    <tr>
                      <th className="px-4 py-3">Message</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Audio</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMessages.map((m) => {
                      const category = CATEGORIES.find((c) => c.id === m.categoryId);
                      return (
                        <tr key={m.id} className="border-t border-ink/5">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {m.videoUrl ? (
                                isImageMedia(m.videoUrl) ? (
                                  <img src={m.videoUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                                ) : (
                                  <video src={m.videoUrl} className="h-11 w-11 rounded-full object-cover" muted />
                                )
                              ) : (
                                <Avatar
                                  color={m.thumbColor}
                                  initials={m.initials || m.title.trim().charAt(0).toUpperCase()}
                                  size={44}
                                />
                              )}
                              <span className="font-medium text-ink">{m.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-inkmuted">
                              {category?.emoji} {category?.label ?? m.categoryId}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {m.audioUrl ? (
                              <span className="inline-flex items-center gap-1 text-sage">
                                <CheckCircle2 size={16} /> Has audio
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-dark">
                                <AlertTriangle size={16} /> Missing audio
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Link
                                to={`/messages/${m.id}`}
                                className="rounded-lg p-2 text-inkmuted hover:bg-canvas hover:text-primary"
                                aria-label={`Edit ${m.title}`}
                              >
                                <Pencil size={16} />
                              </Link>
                              <button
                                onClick={() => setDeleteTarget({ type: "message", id: m.id, label: m.title })}
                                className="rounded-lg p-2 text-inkmuted hover:bg-canvas hover:text-emergency"
                                aria-label={`Delete ${m.title}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab === "contacts" && (
          <section>
            <div className="mb-4 flex justify-end">
              <Link
                to="/contacts/new"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <Plus size={16} /> Add contact
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-inkmuted">Loading contacts…</p>
            ) : contacts.length === 0 ? (
              <EmptyState message="No contacts yet." actionLabel="Add your first contact" to="/contacts/new" />
            ) : (
              <div className="overflow-hidden rounded-card border border-ink/10 bg-surface shadow-card">
                <table className="w-full text-left text-sm">
                  <thead className="bg-canvas text-xs uppercase tracking-wide text-inkmuted">
                    <tr>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Relationship</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c) => (
                      <tr key={c.id} className="border-t border-ink/5">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              color={c.avatarColor}
                              initials={c.initials}
                              imageUrl={c.avatarUrl}
                              size={40}
                            />
                            <span className="font-medium text-ink">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-inkmuted">{c.relationship}</td>
                        <td className="px-4 py-3 text-inkmuted">{c.phone}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/contacts/${c.id}`}
                              className="rounded-lg p-2 text-inkmuted hover:bg-canvas hover:text-primary"
                              aria-label={`Edit ${c.name}`}
                            >
                              <Pencil size={16} />
                            </Link>
                            <button
                              onClick={() => setDeleteTarget({ type: "contact", id: c.id, label: c.name })}
                              className="rounded-lg p-2 text-inkmuted hover:bg-canvas hover:text-emergency"
                              aria-label={`Delete ${c.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === "message" ? "message" : "contact"}?`}
        description={`This will permanently delete "${deleteTarget?.label}"${
          deleteTarget?.type === "message" ? " and its video/audio files" : ""
        }. This can't be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function PatientAccessCard({
  patient,
  onSaved,
}: {
  patient: Patient;
  onSaved: (p: Patient) => void;
}) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(patient.name);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const updated = await patientsApi.updatePatient({ name: name.trim() });
      onSaved(updated);
      setEditing(false);
      showToast("Patient name saved.");
    } catch {
      showToast("Couldn't save. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(patient.inviteCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Couldn't copy — select and copy the code manually.", "error");
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-card border border-primary/10 bg-surface p-5 shadow-card">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-inkmuted">Patient</p>
        {editing ? (
          <div className="mt-1 flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-ink/15 px-2 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              Save
            </button>
            <button
              onClick={() => {
                setName(patient.name);
                setEditing(false);
              }}
              className="text-xs font-medium text-inkmuted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="mt-1 flex items-center gap-2 text-lg font-semibold text-ink hover:text-primary"
          >
            {patient.name}
            <Pencil size={14} className="text-inkmuted" />
          </button>
        )}
      </div>

      <div className="text-right">
        <p className="text-xs font-medium uppercase tracking-wide text-inkmuted">Share access</p>
        <p className="mt-1 text-xs text-inkmuted">Give this code to other caregivers to join</p>
        <button
          onClick={handleCopy}
          className="mt-1 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary-light px-3 py-1.5 font-mono text-sm font-semibold tracking-widest text-primary-dark hover:bg-primary-light/70"
        >
          {patient.inviteCode}
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? "bg-primary text-white" : "bg-surface text-inkmuted hover:bg-primary-light"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ message, actionLabel, to }: { message: string; actionLabel: string; to: string }) {
  return (
    <div className="rounded-card border border-dashed border-ink/15 bg-surface px-6 py-12 text-center">
      <p className="text-sm text-inkmuted">{message}</p>
      <Link to={to} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
        {actionLabel}
      </Link>
    </div>
  );
}
