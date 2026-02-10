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
  role: "user" | "ai";
  content: string;
  timestamp: string;
};

type SidebarAction = {
  label: string;
  payload: string;
  icon: React.ComponentType<{ size?: number }>;
};

const sidebarActions: SidebarAction[] = [
  { label: "Status", payload: "vaultai status", icon: Activity },
  { label: "Load persona", payload: "vaultai load persona", icon: User },
  { label: "Load plan", payload: "vaultai load plan", icon: FileText },
  { label: "Execute step", payload: "vaultai execute step", icon: Play },
  { label: "Write file", payload: "vaultai write file", icon: FilePlus }
];

const formatTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "VaultAI ready. Load your persona or plan to begin. Type commands or chat naturally.",
      timestamp: formatTime()
    }
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const appendMessage = (role: Message["role"], content: string) => {
    setMessages((prev) => [...prev, { role, content, timestamp: formatTime() }]);
  };

  const mockExecute = (text: string) => {
    appendMessage(
      "ai",
      `Acknowledged command:\n\n\`\`\`bash\n${text}\n\`\`\`\n\nStatus: queued in operator console.`
    );
  };

  const handleSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!input.trim()) return;
    appendMessage("user", input.trim());
    mockExecute(input.trim());
    setInput("");
  };

  const handleAction = (payload: string) => {
    appendMessage("user", payload);
    mockExecute(payload);
  };

  return (
    <div className="main-shell">
      <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <div className="sidebar-logo">
          <Image src="/vaultai-logo.svg" alt="VaultAI" width={44} height={44} />
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
        <button className="cta" onClick={() => handleAction("vaultai run now")}> 
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
            {messages.map((msg, idx) => (
              <article key={idx} className={`message ${msg.role}`}>
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
              />
              <button type="submit">
                Send <Send size={18} />
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
