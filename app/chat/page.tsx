"use client";
import { Lock, Mic, Paperclip, Send, Terminal, X, ChevronRight, Settings } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSubscription, FREE_MESSAGE_LIMIT } from "@/lib/subscription-store";
import { useVault, type VaultMessage } from "@/lib/vault-store";
import { useRouter } from "next/navigation";

type GatewayStatus = "connected" | "connecting" | "offline";

const PROMPT_PILLS = [
  "What's my status?",
  "Tell me about myself",
  "Search latest news",
  "Load my persona",
];

export default function ChatPage() {
  const router = useRouter();
  const { lockVault, vaultData, updateVaultData, isUnlocked } = useVault();
  const { subscription, messageCount, canSendMessage, incrementMessageCount, isFeatureAvailable } = useSubscription();
  const [messages, setMessages] = useState<VaultMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState("");
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>("connecting");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [messages]);

  // Load persisted chat history from encrypted vault on unlock
  const historyLoadedRef = useRef(false);
  useEffect(() => {
    if (isUnlocked && vaultData?.chatHistory?.length && !historyLoadedRef.current) {
      historyLoadedRef.current = true;
      setMessages(vaultData.chatHistory);
    }
  }, [isUnlocked, vaultData]);

  // Persist chat history to encrypted vault whenever messages change (skip pending/empty)
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isUnlocked || messages.length === 0) return;
    // Debounce persistence to avoid encrypting on every keystroke
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      const completed = messages.filter(m => !m.pending);
      if (completed.length === 0) return;
      updateVaultData(prev => ({ ...prev, chatHistory: completed })).catch(() => {
        // Vault may be locked during navigation — silently ignore
      });
    }, 500);
    return () => { if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current); };
  }, [messages, isUnlocked, updateVaultData]);

  // Derived from React state — no hydration mismatch (Bug 8 fix)
  const freeLeft = FREE_MESSAGE_LIMIT - messageCount;

  // Gateway status polling
  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health", { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        if (!mounted) return;
        setGatewayStatus(data.status === "ready" ? "connected" : data.status === "no_provider" ? "offline" : "connecting");
      } catch {
        if (mounted) setGatewayStatus("offline");
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const showError = useCallback((msg: string) => {
    setErrorBanner(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrorBanner(null), 10000);
  }, []);

  const handleLock = useCallback(() => {
    lockVault();
    router.push("/vault");
  }, [lockVault, router]);

  const sendCommand = useCallback(async (preset?: string) => {
    const text = (preset || input).trim();
    if (text === "" || sending) return;
    if (!canSendMessage) { setPaywallFeature("messages"); setShowPaywall(true); return; }
    const ts = new Date().toISOString();
    const uid = Date.now().toString();
    const pid = String(Date.now()+1);
    setMessages(prev => [...prev, {id:uid,role:"user",content:text,timestamp:ts}, {id:pid,role:"ai",content:"Processing...",timestamp:ts,pending:true}]);
    setInput(""); setSending(true);
    try {
      const res = await fetch("/api/execute", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({command:text,persona:"operator"})});
      const data = await res.json();
      if (!res.ok) {
        showError(`Gateway error: ${data.response || data.error || "Unknown error"}`);
        setMessages(prev => prev.map(m => m.id===pid ? {...m,role:"error",content:data.response || data.error || "Request failed",pending:false} : m));
        // Bug 11 fix: do NOT increment on error
        return;
      }
      const reply = data.reply || data.response || data.result || "(no response)";
      setMessages(prev => prev.map(m => m.id===pid ? {...m,content:reply,pending:false,timestamp:new Date().toISOString()} : m));
      incrementMessageCount();
    } catch(e) {
      const errMsg = String(e);
      setMessages(prev => prev.map(m => m.id===pid ? {...m,role:"error",content:errMsg,pending:false} : m));
      showError(errMsg);
      // Bug 11 fix: do NOT increment on network error
    } finally { setSending(false); }
  }, [input, sending, canSendMessage, incrementMessageCount, showError]);

  // Bug 9 fix: voice/upload buttons show "coming soon" for premium, paywall for free
  const handleVoice = useCallback(() => {
    if (!isFeatureAvailable("voice_input")) {
      setPaywallFeature("Voice Input");
      setShowPaywall(true);
    } else {
      showError("Voice input is coming soon.");
    }
  }, [isFeatureAvailable, showError]);

  const handleUpload = useCallback(() => {
    if (!isFeatureAvailable("pdf_upload")) {
      setPaywallFeature("PDF Upload");
      setShowPaywall(true);
    } else {
      showError("PDF upload is coming soon.");
    }
  }, [isFeatureAvailable, showError]);

  const statusDotClass = gatewayStatus === "connected" ? "dot connected" : gatewayStatus === "connecting" ? "dot connecting" : "dot offline";
  const statusLabel = gatewayStatus === "connected" ? "Connected" : gatewayStatus === "connecting" ? "Connecting..." : "Offline";
  const hasMessages = messages.length > 0;

  return (
    <div className="console-layout">
      <aside className="console-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-label">CONSOLE</div>
          <button className="sidebar-item active"><Terminal size={16} /> Console</button>
          <button className="sidebar-item" onClick={() => router.push("/")}><Settings size={16} /> Home</button>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-label">QUICK COMMANDS</div>
          {["status","help","summarize"].map(cmd => (<button key={cmd} className="sidebar-item" onClick={() => sendCommand(cmd)}><ChevronRight size={14} /> {cmd}</button>))}
        </div>
        <button className="sidebar-lock" onClick={handleLock}><Lock size={16} /> Lock</button>
      </aside>
      <div className="console-main" style={{position:"relative"}}>
        <header className="console-topbar">
          <div className="topbar-brand"><Lock size={18} /><span>VAULTAI</span></div>
          <div className="topbar-title">Operator Console</div>
          <div className="topbar-actions">
            <div className="status-badge"><span className={statusDotClass} /> {statusLabel}</div>
          </div>
        </header>
        {errorBanner && (
          <div className="error-banner" onClick={() => setErrorBanner(null)}>
            {errorBanner}
          </div>
        )}
        <div className="console-feed" ref={feedRef}>
          {!hasMessages && (
            <div className="empty-state">
              <Lock size={64} strokeWidth={1} style={{ color: "var(--accent)", opacity: 0.4 }} />
              <h2 className="empty-title">Operator Console</h2>
              <p className="empty-subtitle">Ask anything. Search the web. Load your persona. Everything stays encrypted.</p>
              <div className="prompt-pills">
                {PROMPT_PILLS.map(pill => (
                  <button key={pill} className="prompt-pill" onClick={() => sendCommand(pill)}>{pill}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={"console-message " + msg.role + (msg.pending ? " pending" : "")}>
              <div className="message-meta"><span>{msg.role==="user" ? "you" : "vaultai"}</span></div>
              <div><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
              {msg.pending && <div className="message-status">Processing</div>}
            </div>
          ))}
        </div>
        {showPaywall && (
          <div className="onboarding-overlay" onClick={() => setShowPaywall(false)}>
            <div className="onboarding-modal" onClick={e => e.stopPropagation()} style={{maxWidth:420}}>
              <div className="onboarding-header"><Lock size={20} /><h3>Upgrade Required</h3><button className="ghost-btn" onClick={() => setShowPaywall(false)}><X size={16} /></button></div>
              <p className="onboarding-subtitle" style={{marginBottom:16}}>{paywallFeature==="messages" ? "You have used all your free messages. Upgrade to continue." : paywallFeature + " is a premium feature."}</p>
              <div style={{display:"flex",gap:12}}>
                {/* Bug 10 fix: open in new tab to avoid losing chat state */}
                <a href="/#pricing" target="_blank" rel="noopener noreferrer" className="share-create-btn" style={{flex:1,textAlign:"center",textDecoration:"none"}}>View Plans</a>
                <button className="ghost-btn" onClick={() => setShowPaywall(false)} style={{flex:1}}>Maybe Later</button>
              </div>
            </div>
          </div>
        )}
        <div className="console-input">
          <div className="input-bar">
            <button type="button" className="ghost-btn" onClick={handleVoice}><Mic size={18} /></button>
            <button type="button" className="ghost-btn" onClick={handleUpload}><Paperclip size={18} /></button>
            <textarea placeholder="Type a command or question..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey){e.preventDefault();sendCommand();} }} disabled={sending} />
            <button type="button" className="send-btn" onClick={() => sendCommand()} disabled={sending}><Send size={18} /></button>
          </div>
          <div className="console-footer">
            <span className="dot" /> AES-256 Encrypted
            {subscription.active ? <span style={{marginLeft:12,color:"var(--accent)"}}>{subscription.tier==="premium" ? " Premium" : " Lite"}</span> : <span style={{marginLeft:12}}>{freeLeft > 0 ? `${freeLeft} free messages left` : "Free limit reached"}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
