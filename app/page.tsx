'use client';

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Activity,
  FilePlus,
  FileText,
  Play,
  Send,
  User,
  Menu
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
  pending?: boolean;
};

type SidebarAction = {
  label: string;
  payload: string;
  icon: React.ComponentType<{ size?: number }>;
};

const sidebarActions: SidebarAction[] = [
  { label: "Status", payload: "status", icon: Activity },
  { label: "Load persona", payload: "load persona", icon: User },
  { label: "Load plan", payload: "load plan", icon: FileText },
  { label: "Execute step", payload: "execute step", icon: Play },
  { label: "Write file", payload: "write file", icon: FilePlus }
];

const formatTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const createMessage = (role: Message["role"], content: string, pending = false): Message => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  role,
  content,
  pending,
  timestamp: formatTime()
});

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    createMessage(
      "ai",
      "VaultAI ready. Load your persona or plan to begin. Type commands or chat naturally."
    )
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const appendMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const updateMessage = (id: string, content: string, pending = false) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, content, pending } : msg))
    );
  };

  const sendCommand = async (command: string) => {
    if (!command.trim()) return;
    appendMessage(createMessage("user", command));
    const pendingId = createMessage("ai", "Processing command...", true).id;
    appendMessage({
      id: pendingId,
      role: "ai",
      content: "Processing command...",
      timestamp: formatTime(),
      pending: true
    });
    setIsSending(true);
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command })
      });
      const data = await response.json();
      const reply = data.reply || "No response.";
      updateMessage(pendingId, reply, false);
    } catch (error) {
      updateMessage(
        pendingId,
        `Command failed: ${(error as Error).message ?? "unknown error"}`,
        false
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!input.trim()) return;
    const cmd = input.trim();
    setInput("");
    sendCommand(cmd);
  };

  const handleAction = (payload: string) => {
    sendCommand(payload);
  };

  return (
    <div className="main-shell">
      <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <div className="sidebar-logo">
          <Image src="/vaultai-logo.png" alt="VaultAI" width={44} height={44} />
          <div className="sidebar-title">VAULTAI</div>
        </div>
        <nav>
          {sidebarActions.map((action) => (
            <button key={action.label} onClick={() => handleAction(action.payload)}>
              <action.icon size={18} />
              {action.label}
            </button>
          ))}
        </nav>
        <button className="cta" onClick={() => handleAction("run latest command")}> 
          <Play size={18} /> Run Command
        </button>
      </aside>
      <main className="app-body">
        <header className="top-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span className="app-name">VAULTAI</span>
            <span className="status-indicator">
              <span className="status-dot" /> Healthy
            </span>
          </div>
          <button className="mobile-toggle" onClick={() => setSidebarOpen((prev) => !prev)}>
            <Menu size={18} />
          </button>
        </header>
        <section className="chat-panel">
          <div className="chat-log" ref={logRef}>
            {messages.map((msg) => (
              <article key={msg.id} className={`message ${msg.role}${msg.pending ? " pending" : ""}`}>
                <span className="message-meta">
                  {msg.role === "ai" ? "vaultai" : "you"} · {msg.timestamp}
                </span>
                <div className="message-bubble">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              </article>
            ))}
          </div>
          <div className="chat-input">
            <form onSubmit={handleSubmit}>
              <textarea
                placeholder="Type a command or natural language request..."
                value={input}
                onChange={(evt) => setInput(evt.target.value)}
                disabled={isSending}
              />
              <button type="submit" disabled={isSending}>
                {isSending ? "Running" : "Send"} <Send size={18} />
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
