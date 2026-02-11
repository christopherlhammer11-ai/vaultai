"use client";

import {
  ChevronDown,
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
import { useCallback, useEffect, useRef, useState } from "react";
import { useVault, VaultMessage } from "@/lib/vault-store";
import { useRouter } from "next/navigation";

type SidebarPanel = "console" | "persona" | "vault" | "commands" | "settings";

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
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [activePanel, setActivePanel] = useState<SidebarPanel>("console");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
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

  // Scroll to bottom on new messages
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Track scroll position to show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (!logRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollBtn(!isNearBottom);
  }, []);

  useEffect(() => {
    const feed = logRef.current;
    if (!feed) return;
    feed.addEventListener("scroll", handleScroll, { passive: true });
    return () => feed.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
              role: "error" as const,
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

  const handleExport = () => {
    const text = messages
      .filter((m) => !m.pending)
      .map((m) => `[${messageLabel(m.role)}] ${formatTimestamp(m.timestamp)}\n${m.content}`)
      .join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vaultai-export-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearChat = async () => {
    if (!confirm("Clear all chat history? This cannot be undone.")) return;
    await persistMessages([defaultMessage]);
  };

  // ⌘K / Ctrl+K command palette toggle
  useEffect(() => {
    const handler = (evt: KeyboardEvent) => {
      if ((evt.metaKey || evt.ctrlKey) && evt.key === "k") {
        evt.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (evt.key === "Escape") {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="console-layout">
      <aside className="console-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-label">CONSOLE</div>
          <button className={`sidebar-item${activePanel === "console" ? " active" : ""}`} onClick={() => setActivePanel("console")}>
            <ChevronRight size={16} /> Operator Console
          </button>
          <button className={`sidebar-item${activePanel === "persona" ? " active" : ""}`} onClick={() => { setActivePanel("persona"); sendCommand("who am I?"); }}>
            <User size={16} /> Persona
          </button>
          <button className={`sidebar-item${activePanel === "vault" ? " active" : ""}`} onClick={() => { setActivePanel("vault"); sendCommand("vault list"); }}>
            <Lock size={16} /> Vault
          </button>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-label">TOOLS</div>
          <button className={`sidebar-item${activePanel === "commands" ? " active" : ""}`} onClick={() => { setActivePanel("commands"); sendCommand("help"); }}>
            <Terminal size={16} /> Commands
          </button>
          <button className={`sidebar-item${activePanel === "settings" ? " active" : ""}`} onClick={() => { setActivePanel("settings"); sendCommand("status"); }}>
            <Settings size={16} /> Settings
          </button>
        </div>
        <button className="sidebar-lock" onClick={handleLock}>
          <Lock size={16} /> Lock Vault
        </button>
      </aside>

      <div className="console-main" style={{ position: "relative" }}>
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
            <button className="topbar-btn" onClick={handleClearChat} title="Clear chat history">
              <LayoutGrid size={16} /> <span>Clear</span>
            </button>
            <button className="topbar-btn" onClick={() => setShowCommandPalette(true)} title="Command palette (⌘K)">
              <Command size={16} /> <span>⌘ K</span>
            </button>
            <button className="topbar-btn" onClick={handleExport} title="Export chat as text file">
              <Upload size={16} /> <span>Export</span>
            </button>
          </div>
        </header>

        <div className="console-feed" ref={logRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`console-message ${msg.role}${msg.pending ? " pending" : ""}`}>
              <div className="message-meta">
                <span>{messageLabel(msg.role)}</span> · <span>{formatTimestamp(msg.timestamp)}</span>
              </div>
              <div className={msg.pending ? "message-content" : undefined}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
              {msg.pending && <div className="message-status">Processing</div>}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {showScrollBtn && (
          <button className="scroll-indicator" onClick={scrollToBottom} type="button">
            <ChevronDown size={14} /> New messages
          </button>
        )}

        {showCommandPalette && (
          <div className="command-palette-overlay" onClick={() => setShowCommandPalette(false)}>
            <div className="command-palette" onClick={(e) => e.stopPropagation()}>
              <div className="command-palette-header">
                <Command size={16} /> Quick Commands
              </div>
              {[
                { label: "Status", cmd: "status" },
                { label: "Vault List", cmd: "vault list" },
                { label: "Help", cmd: "help" },
                { label: "Summarize", cmd: "summarize" },
                { label: "Who Am I?", cmd: "who am I?" },
                { label: "Share All", cmd: "share all" },
              ].map((item) => (
                <button
                  key={item.cmd}
                  className="command-palette-item"
                  onClick={() => {
                    setShowCommandPalette(false);
                    sendCommand(item.cmd);
                  }}
                >
                  <ChevronRight size={14} /> {item.label}
                  <span className="command-palette-hint">{item.cmd}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="console-input">
          <div className="input-bar">
            <button type="button" className="ghost-btn" aria-label="Insert command" onClick={() => setShowCommandPalette(true)}>
              <Smile size={18} />
            </button>
            <button type="button" className="ghost-btn" aria-label="Voice input (coming soon)" title="Voice input — coming soon">
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
