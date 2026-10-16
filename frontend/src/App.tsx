import { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut } from "lucide-react";
import type { CategoryId, Contact, Message, Screen } from "./types";
import { categories as staticCategories } from "./data/mockData";
import { useAuth } from "./context/AuthContext";
import { listMessages } from "./api/messages";
import { listContacts } from "./api/contacts";
import { sendMessage } from "./api/sending";
import { ApiError } from "./api/client";
import LoginGate from "./components/LoginGate";
import { LoadingScreen, ErrorScreen } from "./components/LoadingErrorScreens";
import CategoryTabs from "./components/CategoryTabs";
import CardGrid from "./components/CardGrid";
import PreviewScreen from "./components/PreviewScreen";
import ContactPicker from "./components/ContactPicker";
import ConfirmSend from "./components/ConfirmSend";
import SentScreen from "./components/SentScreen";

function PatientApp() {
  const { logout, user, patient } = useAuth();

  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all");

  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastSend, setLastSend] = useState<{ whatsappUrl: string | null; audioUrl: string | null }>({
    whatsappUrl: null,
    audioUrl: null,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [msgs, cts] = await Promise.all([listMessages(), listContacts()]);
      setMessages(msgs);
      setContacts(cts);
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Check your connection to the server and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visibleMessages = useMemo(
    () => (activeCategory === "all" ? messages : messages.filter((m) => m.categoryId === activeCategory)),
    [activeCategory, messages]
  );

  const findMessage = (id: string) => messages.find((m) => m.id === id)!;
  const findContact = (id: string) => contacts.find((c) => c.id === id)!;

  if (loading) return <LoadingScreen />;
  if (loadError) return <ErrorScreen message={loadError} onRetry={loadData} />;

  if (screen.name === "preview") {
    return (
      <PreviewScreen
        message={findMessage(screen.messageId)}
        onBack={() => setScreen({ name: "home" })}
        onConfirm={() => setScreen({ name: "contacts", messageId: screen.messageId })}
      />
    );
  }

  if (screen.name === "contacts") {
    return (
      <ContactPicker
        contacts={contacts}
        onBack={() => setScreen({ name: "preview", messageId: screen.messageId })}
        onSelect={(contactId) => setScreen({ name: "confirm", messageId: screen.messageId, contactId })}
      />
    );
  }

  if (screen.name === "confirm") {
    const doSend = async () => {
      setSending(true);
      setSendError(null);
      // Open a blank tab synchronously inside the tap handler so browsers
      // don't treat the later WhatsApp redirect as a blocked popup.
      const popup = window.open("", "_blank");
      try {
        const result = await sendMessage(screen.messageId, screen.contactId);
        if (result.status === "failed" || !result.whatsappUrl) {
          popup?.close();
          setSendError("This message doesn't have a recording yet. Ask a caregiver to add one.");
          return;
        }
        setLastSend({ whatsappUrl: result.whatsappUrl, audioUrl: result.audioUrl ?? null });
        if (popup) popup.location.href = result.whatsappUrl;
        setScreen({ name: "sent", messageId: screen.messageId, contactId: screen.contactId });
      } catch (err) {
        popup?.close();
        setSendError(err instanceof ApiError ? err.message : "Couldn't send. Check your connection and try again.");
      } finally {
        setSending(false);
      }
    };

    return (
      <ConfirmSend
        message={findMessage(screen.messageId)}
        contact={findContact(screen.contactId)}
        onBack={() => {
          setSendError(null);
          setScreen({ name: "contacts", messageId: screen.messageId });
        }}
        onCancel={() => {
          setSendError(null);
          setScreen({ name: "home" });
        }}
        onSend={doSend}
        sending={sending}
        error={sendError}
      />
    );
  }

  if (screen.name === "sent") {
    return (
      <SentScreen
        message={findMessage(screen.messageId)}
        contact={findContact(screen.contactId)}
        whatsappUrl={lastSend.whatsappUrl}
        audioUrl={lastSend.audioUrl}
        onDone={() => setScreen({ name: "home" })}
      />
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="px-5 sm:px-8 pt-8 pb-4 max-w-5xl mx-auto relative">
        <h1 className="text-3xl sm:text-4xl font-bold text-center">What do you want to say?</h1>
        <p className="text-center text-inkmuted mt-1 text-lg">Tap a card to see it and hear it</p>

        {/* Small, deliberately unobtrusive — this is a caregiver control,
            not something the primary user needs to notice or use. */}
        <button
          onClick={() => {
            if (confirm(`Signed in to ${patient?.name ?? "this patient"}${user ? ` as ${user.email}` : ""}. Sign out of this device?`)) logout();
          }}
          aria-label="Sign out"
          className="absolute top-8 right-5 sm:right-8 w-9 h-9 rounded-full bg-surface/60 flex items-center justify-center text-inkmuted/50 hover:text-inkmuted"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <div className="px-5 sm:px-8 max-w-5xl mx-auto">
        <CategoryTabs categories={staticCategories} activeId={activeCategory} onSelect={setActiveCategory} />
      </div>

      <main className="px-5 sm:px-8 py-6 max-w-5xl mx-auto">
        <CardGrid messages={visibleMessages} onSelect={(id) => setScreen({ name: "preview", messageId: id })} />
      </main>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen label="Starting up…" />;
  if (!isAuthenticated) return <LoginGate />;
  return <PatientApp />;
}
