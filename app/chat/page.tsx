"use client";

import {
  ChevronDown,
  ChevronRight,
  Command,
  Download,
  FileText,
  FolderOpen,
  LayoutGrid,
  Lock,
  Mic,
  Paperclip,
  Search,
  Send,
  Settings,
  Smile,
  Terminal,
  Trash2,
  Upload,
  User,
  Users,
  Volume2
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

const personas = [
  { id: "operator", label: "Operator", desc: "Default assistant" },
  { id: "analyst", label: "Analyst", desc: "Data & business analysis" },
  { id: "writer", label: "Writer", desc: "Content & copywriting" },
  { id: "coder", label: "Coder", desc: "Programming assistant" },
];

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
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [activePersona, setActivePersona] = useState<string>("operator");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showFileVault, setShowFileVault] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

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

  // --- Voice Input ---
  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? " " : "") + transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // --- Text-to-Speech ---
  const speakMessage = (msgId: string, text: string) => {
    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // --- PDF Upload ---
  const handlePdfUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF files are supported");
      return;
    }

    const timestamp = new Date().toISOString();
    const userMsg: VaultMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: `\u{1F4C4} Uploaded: ${file.name}`,
      timestamp,
    };
    const pendingId = crypto.randomUUID();
    const pendingMsg: VaultMessage = {
      id: pendingId,
      role: "ai",
      content: "Extracting text from PDF...",
      pending: true,
      timestamp,
    };

    const inFlight = [...messages, userMsg, pendingMsg];
    setSending(true);
    await persistMessages(inFlight);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const parseRes = await fetch("/api/pdf-parse", { method: "POST", body: formData });
      const parseData = await parseRes.json();

      if (!parseRes.ok) throw new Error(parseData.error || "PDF parse failed");

      // Now ask the LLM to summarize
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: `I've uploaded a PDF called "${parseData.filename}" (${parseData.pages} pages). Here's the content:\n\n${parseData.text.slice(0, 8000)}\n\nPlease summarize the key points.`,
          persona: activePersona,
        }),
      });
      const data = await response.json();
      const resolved = inFlight.map((msg) =>
        msg.id === pendingId
          ? { ...msg, content: data?.response || data?.reply || "(no response)", pending: false, timestamp: new Date().toISOString() }
          : msg
      );
      await persistMessages(resolved);
    } catch (error) {
      const failed = inFlight.map((msg) =>
        msg.id === pendingId
          ? { id: pendingId, role: "error" as const, content: (error as Error).message, timestamp: new Date().toISOString() }
          : msg
      );
      await persistMessages(failed);
    } finally {
      setSending(false);
    }
  };

  // --- File Vault ---
  const handleFileVaultUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large (max 5MB for vault storage)");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await updateVaultData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          files: [
            ...((prev.settings.files as any[]) || []),
            {
              name: file.name,
              size: file.size,
              type: file.type,
              data: base64,
              uploadedAt: new Date().toISOString(),
            },
          ],
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const downloadVaultFile = (file: any) => {
    const a = document.createElement("a");
    a.href = file.data;
    a.download = file.name;
    a.click();
  };

  const deleteVaultFile = async (index: number) => {
    if (!confirm("Delete this file from the vault?")) return;
    await updateVaultData((prev) => {
      const files = [...((prev.settings.files as any[]) || [])];
      files.splice(index, 1);
      return { ...prev, settings: { ...prev.settings, files } };
    });
  };

  const vaultFiles = (vaultData?.settings?.files as any[]) || [];

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
        body: JSON.stringify({ command: text, persona: activePersona })
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

  // Command palette toggle + Escape closes search
  useEffect(() => {
    const handler = (evt: KeyboardEvent) => {
      if ((evt.metaKey || evt.ctrlKey) && evt.key === "k") {
        evt.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (evt.key === "Escape") {
        setShowCommandPalette(false);
        if (searchOpen) {
          setSearchOpen(false);
          setSearchQuery("");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen]);

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
          {activePanel === "persona" && (
            <div className="persona-dropdown">
              {personas.map((p) => (
                <button
                  key={p.id}
                  className={`persona-option${activePersona === p.id ? " active" : ""}`}
                  onClick={() => setActivePersona(p.id)}
                >
                  <Users size={12} /> {p.label}
                  <span className="persona-desc">{p.desc}</span>
                </button>
              ))}
            </div>
          )}
          <button className={`sidebar-item${activePanel === "vault" ? " active" : ""}`} onClick={() => { setActivePanel("vault"); sendCommand("vault list"); }}>
            <Lock size={16} /> Vault
          </button>
          <button className={`sidebar-item${showFileVault ? " active" : ""}`} onClick={() => setShowFileVault(!showFileVault)}>
            <FolderOpen size={16} /> Files
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
          <div className="topbar-title">
            Operator Console
            {activePersona !== "operator" && (
              <span className="persona-indicator"> &middot; {personas.find(p => p.id === activePersona)?.label}</span>
            )}
          </div>
          <div className="topbar-actions">
            <div className="live-pill">
              <span className="dot" /> LIVE SESSION
            </div>
            <button className="topbar-btn" onClick={() => setSearchOpen(!searchOpen)} title="Search messages">
              <Search size={16} /> <span>Search</span>
            </button>
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
          {searchOpen && (
            <div className="search-bar">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); } }}
                autoFocus
              />
              <span className="search-count">
                {messages.filter((m) => !m.pending && m.content.toLowerCase().includes(searchQuery.toLowerCase())).length} of {messages.filter(m => !m.pending).length}
              </span>
              <button className="ghost-btn" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>&#10005;</button>
            </div>
          )}
          {messages
            .filter((msg) => !searchQuery || msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((msg) => (
            <div key={msg.id} className={`console-message ${msg.role}${msg.pending ? " pending" : ""}`}>
              <div className="message-meta">
                <span>{messageLabel(msg.role)}</span> · <span>{formatTimestamp(msg.timestamp)}</span>
              </div>
              <div className={msg.pending ? "message-content" : undefined}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                {msg.role === "ai" && !msg.pending && (
                  <button
                    className={`tts-btn${speakingId === msg.id ? " speaking" : ""}`}
                    onClick={() => speakMessage(msg.id, msg.content)}
                    title={speakingId === msg.id ? "Stop speaking" : "Read aloud"}
                  >
                    <Volume2 size={14} />
                  </button>
                )}
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

        {showFileVault && (
          <div className="file-vault-panel">
            <div className="file-vault-header">
              <FolderOpen size={16} /> Encrypted File Vault
              <button className="ghost-btn" onClick={() => setShowFileVault(false)}>&#10005;</button>
            </div>
            <button className="file-vault-upload" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Upload File (max 5MB)
            </button>
            {vaultFiles.length === 0 ? (
              <div className="file-vault-empty">No files stored. Upload files to encrypt and store them in your vault.</div>
            ) : (
              <div className="file-vault-list">
                {vaultFiles.map((file: any, idx: number) => (
                  <div key={idx} className="file-vault-item">
                    <FileText size={14} />
                    <div className="file-vault-info">
                      <span className="file-vault-name">{file.name}</span>
                      <span className="file-vault-meta">{(file.size / 1024).toFixed(1)}KB &middot; {new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <button className="ghost-btn" onClick={() => downloadVaultFile(file)} title="Download"><Download size={14} /></button>
                    <button className="ghost-btn" onClick={() => deleteVaultFile(idx)} title="Delete"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            <button type="button" className={`ghost-btn${isListening ? " listening" : ""}`} aria-label="Voice input" onClick={toggleVoiceInput}>
              <Mic size={18} />
            </button>
            <button type="button" className="ghost-btn" aria-label="Upload PDF" onClick={() => pdfInputRef.current?.click()}>
              <Paperclip size={18} />
            </button>
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePdfUpload(file);
                e.target.value = "";
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileVaultUpload(file);
                e.target.value = "";
              }}
            />
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
            <span className="dot" /> AES-256 &middot; Encrypted &middot; {liveTimestamp}
          </div>
        </div>
      </div>
    </div>
  );
}
