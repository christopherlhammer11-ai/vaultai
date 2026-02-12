"use client";

import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Command,
  Copy,
  Download,
  FileText,
  FolderOpen,
  LayoutGrid,
  Link,
  Lock,
  Mic,
  Paperclip,
  Search,
  Send,
  Settings,
  Share2,
  Smile,
  Terminal,
  Trash2,
  Upload,
  User,
  UserCheck,
  Users,
  Volume2,
  X
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
  const [showReportPanel, setShowReportPanel] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [lastReport, setLastReport] = useState<string | null>(null);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareMessages, setShareMessages] = useState<Set<string>>(new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", role: "", industry: "", context: "" });
  const [showProfilePanel, setShowProfilePanel] = useState(false);
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

  // --- Onboarding / Profile ---
  useEffect(() => {
    if (!isUnlocked || !vaultData) return;
    const profile = vaultData.settings?.profile as any;
    if (!profile) {
      setShowOnboarding(true);
    } else {
      setProfileForm({
        name: profile.name || "",
        role: profile.role || "",
        industry: profile.industry || "",
        context: profile.context || "",
      });
    }
  }, [isUnlocked, vaultData]);

  const saveProfile = async (dismiss?: boolean) => {
    const { name, role, industry, context } = profileForm;
    if (!name.trim() && !dismiss) return;
    await updateVaultData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        profile: { name: name.trim(), role: role.trim(), industry: industry.trim(), context: context.trim(), updatedAt: new Date().toISOString() },
      },
    }));
    setShowOnboarding(false);
    setShowProfilePanel(false);
    if (name.trim() && !dismiss) {
      const intro = `The user just set up their profile: Name: ${name.trim()}${role.trim() ? `, Role: ${role.trim()}` : ""}${industry.trim() ? `, Industry: ${industry.trim()}` : ""}${context.trim() ? `. Additional context: ${context.trim()}` : ""}. Welcome them briefly.`;
      sendCommand(intro);
    }
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

  // --- Scheduled Reports ---
  const generateReport = async (reportType: "daily" | "weekly") => {
    setReportLoading(true);
    setLastReport(null);
    try {
      const nonPending = messages.filter((m) => !m.pending && m.role !== "error");
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nonPending,
          reportType,
          timeRange: reportType === "daily" ? "today" : "this week",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Report failed");
      setLastReport(data.report);
    } catch (error) {
      setLastReport(`Error: ${(error as Error).message}`);
    } finally {
      setReportLoading(false);
    }
  };

  const downloadReport = () => {
    if (!lastReport) return;
    const blob = new Blob([lastReport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vaultai-report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Team Sharing ---
  const toggleShareMessage = (msgId: string) => {
    setShareMessages((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  const selectAllForShare = () => {
    const nonPending = messages.filter((m) => !m.pending && m.id !== "welcome");
    setShareMessages(new Set(nonPending.map((m) => m.id)));
  };

  const createShareLink = async () => {
    if (shareMessages.size === 0) {
      alert("Select at least one message to share.");
      return;
    }
    setShareLoading(true);
    setShareUrl(null);
    try {
      const selectedMsgs = messages
        .filter((m) => shareMessages.has(m.id))
        .map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        }));
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: selectedMsgs,
          expiresIn: 24,
          sharedBy: "VaultAI User",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Share failed");
      setShareUrl(data.shareUrl);
    } catch (error) {
      alert(`Share failed: ${(error as Error).message}`);
    } finally {
      setShareLoading(false);
    }
  };

  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
    }
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
        body: JSON.stringify({ command: text, persona: activePersona, userProfile: (vaultData?.settings?.profile as any) || null })
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
          <button className={`sidebar-item${showProfilePanel ? " active" : ""}`} onClick={() => { setShowProfilePanel(!showProfilePanel); }}>
            <UserCheck size={16} /> Profile
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
          <div className="sidebar-label">COLLABORATE</div>
          <button className={`sidebar-item${showReportPanel ? " active" : ""}`} onClick={() => { setShowReportPanel(!showReportPanel); setShowSharePanel(false); }}>
            <Calendar size={16} /> Reports
          </button>
          <button className={`sidebar-item${showSharePanel ? " active" : ""}`} onClick={() => { setShowSharePanel(!showSharePanel); setShowReportPanel(false); }}>
            <Share2 size={16} /> Share
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

        {showReportPanel && (
          <div className="file-vault-panel report-panel">
            <div className="file-vault-header">
              <Calendar size={16} /> Scheduled Reports
              <button className="ghost-btn" onClick={() => setShowReportPanel(false)}>&#10005;</button>
            </div>
            <div className="report-actions">
              <button
                className="report-btn"
                onClick={() => generateReport("daily")}
                disabled={reportLoading || messages.length <= 1}
              >
                <Clock size={14} /> Daily Digest
              </button>
              <button
                className="report-btn"
                onClick={() => generateReport("weekly")}
                disabled={reportLoading || messages.length <= 1}
              >
                <Calendar size={14} /> Weekly Summary
              </button>
            </div>
            {reportLoading && (
              <div className="report-loading">
                <span className="dot" /> Generating report...
              </div>
            )}
            {lastReport && (
              <div className="report-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{lastReport}</ReactMarkdown>
                <div className="report-footer">
                  <button className="ghost-btn" onClick={downloadReport} title="Download report">
                    <Download size={14} /> Download .md
                  </button>
                </div>
              </div>
            )}
            {!reportLoading && !lastReport && (
              <div className="file-vault-empty">
                Generate a daily or weekly AI summary of your conversations. Reports analyze topics, decisions, and action items.
              </div>
            )}
          </div>
        )}

        {showSharePanel && (
          <div className="file-vault-panel share-panel">
            <div className="file-vault-header">
              <Share2 size={16} /> Share Conversation
              <button className="ghost-btn" onClick={() => { setShowSharePanel(false); setShareUrl(null); setShareMessages(new Set()); }}>&#10005;</button>
            </div>
            <div className="share-info">
              Select messages to share. Links expire in 24 hours.
            </div>
            <div className="share-actions">
              <button className="ghost-btn" onClick={selectAllForShare}>Select All</button>
              <button className="ghost-btn" onClick={() => setShareMessages(new Set())}>Clear</button>
              <span className="search-count">{shareMessages.size} selected</span>
            </div>
            <div className="share-message-list">
              {messages.filter((m) => !m.pending && m.id !== "welcome").map((msg) => (
                <label key={msg.id} className={`share-message-item${shareMessages.has(msg.id) ? " selected" : ""}`}>
                  <input
                    type="checkbox"
                    checked={shareMessages.has(msg.id)}
                    onChange={() => toggleShareMessage(msg.id)}
                  />
                  <span className="share-msg-role">{messageLabel(msg.role)}</span>
                  <span className="share-msg-preview">{msg.content.slice(0, 60)}{msg.content.length > 60 ? "..." : ""}</span>
                </label>
              ))}
            </div>
            <button
              className="share-create-btn"
              onClick={createShareLink}
              disabled={shareLoading || shareMessages.size === 0}
            >
              {shareLoading ? "Creating..." : <><Link size={14} /> Create Share Link</>}
            </button>
            {shareUrl && (
              <div className="share-url-box">
                <code>{shareUrl}</code>
                <button className="ghost-btn" onClick={copyShareUrl} title="Copy link">
                  <Copy size={14} />
                </button>
              </div>
            )}
          </div>
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

        {/* Onboarding Modal */}
        {showOnboarding && (
          <div className="onboarding-overlay">
            <div className="onboarding-modal">
              <div className="onboarding-header">
                <UserCheck size={20} />
                <h3>Welcome to VaultAI</h3>
                <button className="ghost-btn" onClick={() => { setShowOnboarding(false); saveProfile(true); }} title="Skip">
                  <X size={16} />
                </button>
              </div>
              <p className="onboarding-subtitle">Tell me a little about yourself so I can personalize your experience. Everything stays encrypted in your vault.</p>
              <div className="onboarding-form">
                <label>
                  <span>Your name</span>
                  <input
                    type="text"
                    placeholder="e.g. Alex"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                    autoFocus
                  />
                </label>
                <label>
                  <span>Your role</span>
                  <input
                    type="text"
                    placeholder="e.g. Founder, Engineer, Designer"
                    value={profileForm.role}
                    onChange={(e) => setProfileForm((p) => ({ ...p, role: e.target.value }))}
                  />
                </label>
                <label>
                  <span>Industry</span>
                  <input
                    type="text"
                    placeholder="e.g. SaaS, Healthcare, Finance"
                    value={profileForm.industry}
                    onChange={(e) => setProfileForm((p) => ({ ...p, industry: e.target.value }))}
                  />
                </label>
                <label>
                  <span>Anything else I should know?</span>
                  <textarea
                    placeholder="e.g. I prefer concise answers, I'm building a startup, I work with sensitive data..."
                    value={profileForm.context}
                    onChange={(e) => setProfileForm((p) => ({ ...p, context: e.target.value }))}
                    rows={3}
                  />
                </label>
              </div>
              <div className="onboarding-actions">
                <button className="ghost-btn" onClick={() => { setShowOnboarding(false); saveProfile(true); }}>Skip for now</button>
                <button className="share-create-btn" onClick={() => saveProfile()} disabled={!profileForm.name.trim()}>
                  <UserCheck size={14} /> Save & Start
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Edit Panel */}
        {showProfilePanel && !showOnboarding && (
          <div className="file-vault-panel" style={{ width: 380 }}>
            <div className="file-vault-header">
              <UserCheck size={16} /> Your Profile
              <button className="ghost-btn" onClick={() => setShowProfilePanel(false)}>&#10005;</button>
            </div>
            <div className="onboarding-form" style={{ padding: "16px" }}>
              <label>
                <span>Name</span>
                <input type="text" value={profileForm.name} onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} />
              </label>
              <label>
                <span>Role</span>
                <input type="text" value={profileForm.role} onChange={(e) => setProfileForm((p) => ({ ...p, role: e.target.value }))} />
              </label>
              <label>
                <span>Industry</span>
                <input type="text" value={profileForm.industry} onChange={(e) => setProfileForm((p) => ({ ...p, industry: e.target.value }))} />
              </label>
              <label>
                <span>Context</span>
                <textarea value={profileForm.context} onChange={(e) => setProfileForm((p) => ({ ...p, context: e.target.value }))} rows={3} />
              </label>
              <button className="share-create-btn" onClick={() => saveProfile()} style={{ marginTop: 8 }}>
                <UserCheck size={14} /> Save Profile
              </button>
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
