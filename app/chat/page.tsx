"use client";

import {
  ChevronRight,
  Command,
  LayoutGrid,
  Lock,
  Mic,
  Send,
  Settings,
  Smile,
  Terminal,
  Upload,
  User
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useRef, useState } from "react";
import { useVault, VaultMessage } from "@/lib/vault-store";
import { useRouter } from "next/navigation";

const quickCommands = ["status", "vault list", "share all", "summarize", "help"];
const SEARCH_TRIGGER = /^(?:web\s+)?search\b|^find\b|^latest on\b|^look up\b/i;

const defaultMessage: VaultMessage = {
  id: "welcome",
  role: "ai",
  content: "VaultAI ready. AES-256-GCM encrypted. Try status, vault list, or ask anything.",
  timestamp: undefined
};

const formatTimestamp = (stamp?: string) => {
  if (!stamp) return "--:--";
  const date = new Date(stamp);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const messageLabel = (role: VaultMessage["role"]) => {
  if (role === "user") return "you";
  if (role === "error") return "system";
  return "vaultai";
};

export default function ChatPage() {
  const { isUnlocked, vaultData, updateVaultData, lockVault } = useVault();
  const router = useRouter();
  const [messages, setMessages] = useState<VaultMessage[]>([defaultMessage]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [liveTimestamp, setLiveTimestamp] = useState("--:--");
  const logRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isUnlocked) {
      router.replace("/vault");
      return;
    }
    if (vaultData?.chatHistory?.length) {
      setMessages(vaultData.chatHistory);
    } else {
      setMessages([defaultMessage]);
    }
  }, [isUnlocked, vaultData, router]);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((msg) => (msg.timestamp ? msg : { ...msg, timestamp: new Date().toISOString() }))
    );
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const persistMessages = async (nextMessages: VaultMessage[]) => {
    setMessages(nextMessages);
    await updateVaultData((prev) => ({
      ...prev,
      chatHistory: nextMessages
    }));
  };

  const sendCommand = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || sending || !isUnlocked) return;

    const timestamp = new Date().toISOString();
    const userMessage: VaultMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp
    };
    const pendingId = crypto.randomUUID();
    const pendingMessage: VaultMessage = {
      id: pendingId,
      role: "ai",
      content: SEARCH_TRIGGER.test(text.toLowerCase()) ? "Searching Brave..." : "Processing...",
      pending: true,
      timestamp
    };

    const inFlight = [...messages, userMessage, pendingMessage];
    setInput("");
    setSending(true);
    await persistMessages(inFlight);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: text })
      });
      const data = await response.json();
      const replyText = data?.reply || data?.response || "(no response)";
      const resolved = inFlight.map((msg) =>
        msg.id === pendingId
          ? { ...msg, content: replyText, pending: false, timestamp: new Date().toISOString() }
          : msg
      );
      await persistMessages(resolved);
    } catch (error) {
      const failed = inFlight.map((msg) =>
        msg.id === pendingId
          ? {
              id: pendingId,
              role: "error",
              content: (error as Error).message || "Command failed",
              timestamp: new Date().toISOString()
            }
          : msg
      );
      await persistMessages(failed);
    } finally {
      setSending(false);
    }
  };

  const handleQuickCommand = (cmd: string) => {
    if (sending) return;
    sendCommand(cmd);
  };

  useEffect(() => {
    const update = () =>
      setLiveTimestamp(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLock = () => {
    lockVault();
    router.replace("/vault");
  };

  return (
    <div className="console-layout">
      <aside className="console-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-label">CONSOLE</div>
          <button className="sidebar-item active">
            <ChevronRight size={16} /> Operator Console
          </button>
          <button className="sidebar-item">
            <User size={16} /> Persona
          </button>
          <button className="sidebar-item">
            <Lock size={16} /> Vault
          </button>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-label">TOOLS</div>
          <button className="sidebar-item">
            <Terminal size={16} /> Commands
          </button>
          <button className="sidebar-item">
            <Settings size={16} /> Settings
          </button>
        </div>
        <button className="sidebar-lock" onClick={handleLock}>
          <Lock size={16} /> Lock Vault
        </button>
      </aside>

      <div className="console-main">
        <header className="console-topbar">
          <div className="topbar-brand">
            <Lock size={18} />
            <span>VAULTAI</span>
          </div>
          <div className="topbar-title">Operator Console</div>
          <div className="topbar-actions">
            <div className="live-pill">
              <span className="dot" /> LIVE SESSION
            </div>
            <button className="topbar-btn">
              <LayoutGrid size={16} /> Panel
            </button>
            <button className="topbar-btn">
              <Command size={16} /> ⌘ K
            </button>
            <button className="topbar-btn">
              <Upload size={16} /> Export
            </button>
          </div>
        </header>

        <div className="console-feed" ref={logRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`console-message ${msg.role}${msg.pending ? " pending" : ""}`}>
              <div className="message-meta">
                <span>{messageLabel(msg.role)}</span> · <span>{formatTimestamp(msg.timestamp)}</span>
              </div>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              {msg.pending && <div className="message-status">Queued…</div>}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="console-input">
          <div className="input-bar">
            <button type="button" className="ghost-btn" aria-label="Emoji picker">
              <Smile size={18} />
            </button>
            <button type="button" className="ghost-btn" aria-label="Voice input">
              <Mic size={18} />
            </button>
            <textarea
              placeholder="Type a command or question..."
              value={input}
              onChange={(evt) => setInput(evt.target.value)}
              onKeyDown={(evt) => {
                if (evt.key === "Enter" && !evt.shiftKey) {
                  evt.preventDefault();
                  sendCommand();
                }
              }}
              disabled={sending}
            />
            <button type="button" className="send-btn" onClick={() => sendCommand()} disabled={sending}>
              <Send size={18} />
            </button>
          </div>
          <div className="quick-chips">
            {quickCommands.map((cmd) => (
              <button key={cmd} type="button" onClick={() => handleQuickCommand(cmd)}>
                {cmd}
              </button>
            ))}
          </div>
          <div className="console-footer">
            <span className="dot" /> AES-256 · Encrypted · {liveTimestamp}
          </div>
        </div>
      </div>
    </div>
  );
}
