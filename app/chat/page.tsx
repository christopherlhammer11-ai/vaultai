"use client";

import Image from "next/image";
import { Menu, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

const initialMessage: Message = {
  id: "welcome",
  role: "ai",
  content: "VaultAI ready. Load persona or send a command."
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: trimmed })
      });
      const data = await res.json();
      const reply = data?.reply || "(no response)";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", content: reply }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          content: `Command failed: ${(error as Error).message}`
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-shell">
      <aside className="chat-sidebar">
        <div className="chat-logo">
          <Image src="/vaultai-logo.png" alt="VaultAI" width={40} height={40} />
          <span>VaultAI</span>
        </div>
        <nav>
          <a>Persona</a>
          <a>Plan</a>
          <a>Commands</a>
          <a>Settings</a>
        </nav>
      </aside>
      <main className="chat-main">
        <header className="chat-main-header">
          <button className="chat-menu">
            <Menu size={18} />
          </button>
          <div>
            <div className="section-label">LIVE SESSION</div>
            <h1>Operator Console</h1>
          </div>
        </header>
        <div className="chat-feed">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble ${msg.role}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          ))}
        </div>
        <form
          className="chat-input-bar"
          onSubmit={(evt) => {
            evt.preventDefault();
            sendMessage();
          }}
        >
          <textarea
            placeholder="Type a command or question..."
            value={input}
            onChange={(evt) => setInput(evt.target.value)}
            disabled={sending}
          />
          <button type="submit" disabled={sending}>
            {sending ? "Sending" : "Send"} <Send size={16} />
          </button>
        </form>
      </main>
    </div>
  );
}
