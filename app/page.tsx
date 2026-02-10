'use client';

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: "user" | "ai";
  content: string;
  timestamp: string;
};

const sidebarActions = [
  { label: "Status", payload: "vaultai status" },
  { label: "Load persona", payload: "vaultai load persona" },
  { label: "Load plan", payload: "vaultai load plan" },
  { label: "Execute step", payload: "vaultai execute step" },
  { label: "Write file", payload: "vaultai write file" }
];

const formatTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "VaultAI kernel ready. Local memory mounted and encrypted.",
      timestamp: formatTime()
    }
  ]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const appendMessage = (role: Message["role"], content: string) => {
    setMessages((prev) => [...prev, { role, content, timestamp: formatTime() }]);
  };

  const simulateAiResponse = (inputText: string) => {
    appendMessage(
      "ai",
      `Acknowledged command:\n\n\`\`\`bash\n${inputText}\n\`\`\`\n\nStatus: queued in local executor.`
    );
  };

  const handleSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!input.trim()) return;
    appendMessage("user", input.trim());
    simulateAiResponse(input.trim());
    setInput("");
  };

  const handleAction = (payload: string) => {
    appendMessage("user", payload);
    simulateAiResponse(payload);
  };

  return (
    <div className="main-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Image src="/vaultai-logo.svg" alt="VaultAI" width={40} height={40} />
          <div className="sidebar-title">VAULTAI</div>
        </div>
        {sidebarActions.map((action, idx) => (
          <button
            key={action.label}
            className={idx === 0 ? "secondary" : undefined}
            onClick={() => handleAction(action.payload)}
          >
            {action.label}
          </button>
        ))}
        <button className="primary" onClick={() => handleAction("vaultai cta run")}>Run command</button>
      </aside>
      <div className="app-content">
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
          <form className="chat-input-bar" onSubmit={handleSubmit}>
            <input
              placeholder="Type a command..."
              value={input}
              onChange={(evt) => setInput(evt.target.value)}
            />
            <button type="submit">Send</button>
          </form>
        </section>
        <div className="footer-tag">VAULTAI</div>
      </div>
    </div>
  );
}
