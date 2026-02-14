"use client";
import {
  Lock, Mic, MicOff, Paperclip, Send, Terminal, X, ChevronRight, Trash2,
  FileText, Share2, User, Search, BarChart3, Bot, Zap, Globe, Settings, Key,
  Plus, FolderPlus, MessageSquare, ChevronDown, Edit3, Check, Download,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSubscription, FREE_MESSAGE_LIMIT } from "@/lib/subscription-store";
import { useVault, type VaultMessage } from "@/lib/vault-store";
import { useRouter } from "next/navigation";
import { useI18n, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import {
  BUILT_IN_AGENTS, DEFAULT_AGENT_ID, getAgentById, buildCustomAgent,
  CUSTOM_AGENT_ICONS, CUSTOM_AGENT_COLORS,
  type AgentDef, type CustomAgentInput,
} from "@/lib/agents";

type GatewayStatus = "connected" | "connecting" | "offline";

/** Simple emoji-based agent icon to avoid lucide barrel import issues in dev */
const AGENT_EMOJI: Record<string, string> = {
  Terminal: "\u2318", Target: "\uD83C\uDFAF", Scale: "\u2696\uFE0F", TrendingUp: "\uD83D\uDCC8",
  BookOpen: "\uD83D\uDCDA", Wrench: "\uD83D\uDD27", PenTool: "\u270D\uFE0F",
  Bot: "\uD83E\uDD16", Brain: "\uD83E\uDDE0", Cpu: "\uD83D\uDCBB", Flame: "\uD83D\uDD25",
  Heart: "\u2764\uFE0F", Lightbulb: "\uD83D\uDCA1", Rocket: "\uD83D\uDE80", Shield: "\uD83D\uDEE1\uFE0F",
  Star: "\u2B50", Wand2: "\u2728", Zap: "\u26A1",
};
function AgentIcon({ name, size = 14 }: { name: string; size?: number }) {
  const emoji = AGENT_EMOJI[name] || "\uD83E\uDD16";
  return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>{emoji}</span>;
}

/** Detect if running inside Electron desktop app */
function isElectron(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as unknown as Record<string, unknown>).electron ||
    (typeof navigator !== "undefined" && navigator.userAgent.includes("Electron"));
}

// ---- Multi-conversation types ----
type Conversation = {
  id: string;
  name: string;
  groupId: string | null;
  messages: VaultMessage[];
  createdAt: string;
  updatedAt: string;
};

type ConversationGroup = {
  id: string;
  name: string;
  collapsed: boolean;
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function ChatPage() {
  const router = useRouter();
  const { lockVault, vaultData, updateVaultData, isUnlocked } = useVault();
  const { subscription, messageCount, canSendMessage, incrementMessageCount, isFeatureAvailable } = useSubscription();
  const { t, locale, setLocale } = useI18n();

  // ---- Multi-conversation state ----
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<ConversationGroup[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showLangPicker, setShowLangPicker] = useState(false);

  // ---- Chat state (for active conversation) ----
  const [messages, setMessages] = useState<VaultMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState("");
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>("connecting");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [uploadedPdf, setUploadedPdf] = useState<{ name: string; text: string } | null>(null);
  const [sidebarSection, setSidebarSection] = useState<"commands" | "agents">("commands");
  // ---- Agent state ----
  const [activeAgentId, setActiveAgentId] = useState<string>(DEFAULT_AGENT_ID);
  const [customAgents, setCustomAgents] = useState<AgentDef[]>([]);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [newAgent, setNewAgent] = useState<CustomAgentInput>({
    name: "", tagline: "", icon: "Bot", color: "#00ff88",
    expertise: "", personality: "", instructions: "",
  });

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeys, setApiKeys] = useState({ openai: "", anthropic: "", gemini: "", groq: "", mistral: "", deepseek: "", brave: "" });
  const [onboardingStep, setOnboardingStep] = useState(-1);
  const [onboardingAnswers, setOnboardingAnswers] = useState<Record<string, string>>({});
  const [onboardingInput, setOnboardingInput] = useState("");
  const [computeUnits, setComputeUnits] = useState<{ remaining: number; total: number; usingOwnKey: boolean } | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const ONBOARDING_STEPS = [
    { key: "name", q: t.onboarding_q_name, placeholder: t.onboarding_q_name_placeholder },
    { key: "role", q: t.onboarding_q_role, placeholder: t.onboarding_q_role_placeholder },
    { key: "use_case", q: t.onboarding_q_use, placeholder: t.onboarding_q_use_placeholder },
    { key: "style", q: t.onboarding_q_style, placeholder: t.onboarding_q_style_placeholder },
  ];

  const PROMPT_PILLS = [
    t.pill_status,
    t.pill_persona,
    t.pill_search,
    t.pill_report,
  ];

  // Auto-focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [messages]);

  // ---- Load conversations from vault ----
  const historyLoadedRef = useRef(false);
  useEffect(() => {
    if (!isUnlocked || historyLoadedRef.current) return;
    historyLoadedRef.current = true;

    // Load multi-conversation data
    const savedConvos = (vaultData?.settings?.conversations as Conversation[] | undefined) || [];
    const savedGroups = (vaultData?.settings?.conversation_groups as ConversationGroup[] | undefined) || [];

    if (savedConvos.length > 0) {
      setConversations(savedConvos);
      setGroups(savedGroups);
      // Activate most recently updated
      const sorted = [...savedConvos].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setActiveConvoId(sorted[0].id);
      setMessages(sorted[0].messages);
    } else if (vaultData?.chatHistory?.length) {
      // Migrate legacy single-chat to multi-conversation
      const legacy: Conversation = {
        id: generateId(),
        name: "Chat 1",
        groupId: null,
        messages: vaultData.chatHistory,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversations([legacy]);
      setActiveConvoId(legacy.id);
      setMessages(legacy.messages);
    } else {
      // Fresh vault — create first conversation
      const first: Conversation = {
        id: generateId(),
        name: "Chat 1",
        groupId: null,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversations([first]);
      setActiveConvoId(first.id);
    }
  }, [isUnlocked, vaultData]);

  // Load saved API keys from vault data and push to server
  useEffect(() => {
    if (isUnlocked && vaultData?.settings) {
      const keys = {
        openai: String(vaultData.settings.openai_api_key || ""),
        anthropic: String(vaultData.settings.anthropic_api_key || ""),
        gemini: String(vaultData.settings.gemini_api_key || ""),
        groq: String(vaultData.settings.groq_api_key || ""),
        mistral: String(vaultData.settings.mistral_api_key || ""),
        deepseek: String(vaultData.settings.deepseek_api_key || ""),
        brave: String(vaultData.settings.brave_api_key || ""),
      };
      setApiKeys(keys);
      const hasAnyKey = Object.values(keys).some(k => !!k);
      if (hasAnyKey) {
        fetch("/api/configure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            openai_api_key: keys.openai,
            anthropic_api_key: keys.anthropic,
            gemini_api_key: keys.gemini,
            groq_api_key: keys.groq,
            mistral_api_key: keys.mistral,
            deepseek_api_key: keys.deepseek,
            brave_api_key: keys.brave,
          }),
        }).catch(() => {});
      }
    }
  }, [isUnlocked, vaultData]);

  // Fetch compute unit balance on launch (desktop only)
  const creditsChecked = useRef(false);
  useEffect(() => {
    if (!isUnlocked || creditsChecked.current) return;
    creditsChecked.current = true;
    if (isElectron()) {
      fetch("/api/credits", { signal: AbortSignal.timeout(5000) })
        .then(res => res.json())
        .then(data => {
          if (data.remainingUnits !== undefined) {
            setComputeUnits({ remaining: data.remainingUnits, total: data.totalUnits, usingOwnKey: data.usingOwnKey });
          }
        })
        .catch(() => {});
    }
  }, [isUnlocked]);

  // For non-desktop (web) users without a provider, show API key setup
  // Desktop premium users get bundled key + compute units, so no key entry needed
  const setupPromptShown = useRef(false);
  const [needsApiKeys, setNeedsApiKeys] = useState(false);
  useEffect(() => {
    if (!isUnlocked || setupPromptShown.current) return;
    setupPromptShown.current = true;
    fetch("/api/health", { signal: AbortSignal.timeout(5000) })
      .then(res => res.json())
      .then(data => {
        if (data.status === "no_provider" && !isElectron()) {
          // Web users with no provider need to add keys
          setNeedsApiKeys(true);
          setShowApiKeyModal(true);
        }
        // Desktop users: bundled key from .env.local handles it — no modal needed
      })
      .catch(() => {});
  }, [isUnlocked]);

  // Show persona onboarding AFTER API key check resolves
  const onboardingChecked = useRef(false);
  useEffect(() => {
    if (!isUnlocked || onboardingChecked.current) return;
    if (needsApiKeys) return;
    if (showApiKeyModal) return;
    onboardingChecked.current = true;
    if (!vaultData?.persona && (!vaultData?.chatHistory || vaultData.chatHistory.length === 0)) {
      setOnboardingStep(0);
    }
  }, [isUnlocked, vaultData, needsApiKeys, showApiKeyModal]);

  const handleOnboardingSubmit = useCallback(async () => {
    const answer = onboardingInput.trim();
    if (!answer) return;

    const currentStep = ONBOARDING_STEPS[onboardingStep];
    if (!currentStep) return;

    const newAnswers = { ...onboardingAnswers, [currentStep.key]: answer };
    setOnboardingAnswers(newAnswers);
    setOnboardingInput("");

    const nextStep = onboardingStep + 1;
    if (nextStep < ONBOARDING_STEPS.length) {
      setOnboardingStep(nextStep);
    } else {
      setOnboardingStep(-1);

      const personaText = [
        `Name: ${newAnswers.name || ""}`,
        `Role: ${newAnswers.role || ""}`,
        `Uses VaultAI for: ${newAnswers.use_case || ""}`,
        `Communication style: ${newAnswers.style || ""}`,
      ].join("\n");

      await updateVaultData(prev => ({
        ...prev,
        persona: personaText,
        settings: {
          ...(prev.settings || {}),
          user_name: newAnswers.name,
          user_role: newAnswers.role,
          user_use_case: newAnswers.use_case,
          user_style: newAnswers.style,
          onboarding_completed: new Date().toISOString(),
        }
      }));

      try {
        await fetch("/api/save-persona", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ persona: personaText }),
        });
      } catch { /* ok if fails */ }

      const name = newAnswers.name || "there";
      const welcomeMsg: VaultMessage = {
        id: Date.now().toString(),
        role: "ai",
        content: t.onboarding_welcome(name),
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);

      // Update active conversation with welcome message
      setConversations(prev => prev.map(c =>
        c.id === activeConvoId ? { ...c, messages: [welcomeMsg], updatedAt: new Date().toISOString() } : c
      ));

      setTimeout(() => inputRef.current?.focus(), 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingStep, onboardingInput, onboardingAnswers, updateVaultData, activeConvoId]);

  // Load custom agents from vault
  const agentsLoadedRef = useRef(false);
  useEffect(() => {
    if (!isUnlocked || agentsLoadedRef.current) return;
    agentsLoadedRef.current = true;
    const saved = (vaultData?.settings?.custom_agents as AgentDef[] | undefined) || [];
    if (saved.length > 0) setCustomAgents(saved);
    const savedAgentId = vaultData?.settings?.active_agent_id as string | undefined;
    if (savedAgentId) setActiveAgentId(savedAgentId);
  }, [isUnlocked, vaultData]);

  // Persist conversations + agents to encrypted vault
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isUnlocked || conversations.length === 0) return;
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      updateVaultData(prev => ({
        ...prev,
        settings: {
          ...(prev.settings || {}),
          conversations: conversations,
          conversation_groups: groups,
          custom_agents: customAgents,
          active_agent_id: activeAgentId,
        }
      })).catch(() => {});
    }, 800);
    return () => { if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current); };
  }, [conversations, groups, customAgents, activeAgentId, isUnlocked, updateVaultData]);

  const freeLeft = FREE_MESSAGE_LIMIT - messageCount;
  const desktop = isElectron();

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

  // ---- MULTI-CONVERSATION HANDLERS ----
  const switchConversation = useCallback((id: string) => {
    // Save current messages to current conversation
    setConversations(prev => prev.map(c =>
      c.id === activeConvoId ? { ...c, messages, updatedAt: new Date().toISOString() } : c
    ));
    // Switch
    setActiveConvoId(id);
    const target = conversations.find(c => c.id === id);
    setMessages(target?.messages || []);
    setUploadedPdf(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [activeConvoId, messages, conversations]);

  const createNewConversation = useCallback((groupId: string | null = null) => {
    // Save current
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === activeConvoId ? { ...c, messages, updatedAt: new Date().toISOString() } : c
      );
      const newConvo: Conversation = {
        id: generateId(),
        name: `Chat ${updated.length + 1}`,
        groupId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setActiveConvoId(newConvo.id);
      setMessages([]);
      setTimeout(() => inputRef.current?.focus(), 50);
      return [...updated, newConvo];
    });
  }, [activeConvoId, messages]);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        // Always keep at least one
        const fresh: Conversation = {
          id: generateId(), name: "Chat 1", groupId: null, messages: [],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        setActiveConvoId(fresh.id);
        setMessages([]);
        return [fresh];
      }
      if (id === activeConvoId) {
        const next = filtered[0];
        setActiveConvoId(next.id);
        setMessages(next.messages);
      }
      return filtered;
    });
  }, [activeConvoId]);

  const renameConversation = useCallback((id: string, name: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    setRenamingId(null);
    setRenameValue("");
  }, []);

  const createGroup = useCallback(() => {
    if (!newGroupName.trim()) return;
    const g: ConversationGroup = { id: generateId(), name: newGroupName.trim(), collapsed: false };
    setGroups(prev => [...prev, g]);
    setNewGroupName("");
    setShowNewGroup(false);
  }, [newGroupName]);

  const toggleGroupCollapse = useCallback((id: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, collapsed: !g.collapsed } : g));
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    // Ungroup conversations in that group
    setConversations(prev => prev.map(c => c.groupId === id ? { ...c, groupId: null } : c));
  }, []);

  const moveToGroup = useCallback((convoId: string, groupId: string | null) => {
    setConversations(prev => prev.map(c => c.id === convoId ? { ...c, groupId } : c));
  }, []);

  // ---- AGENT HANDLERS ----
  const handleCreateAgent = useCallback(() => {
    if (!newAgent.name.trim() || !newAgent.expertise.trim()) return;
    const agent = buildCustomAgent(newAgent);
    setCustomAgents(prev => [...prev, agent]);
    setActiveAgentId(agent.id);
    setShowCreateAgent(false);
    setNewAgent({ name: "", tagline: "", icon: "Bot", color: "#00ff88", expertise: "", personality: "", instructions: "" });
  }, [newAgent]);

  const handleDeleteCustomAgent = useCallback((id: string) => {
    setCustomAgents(prev => prev.filter(a => a.id !== id));
    if (activeAgentId === id) setActiveAgentId(DEFAULT_AGENT_ID);
  }, [activeAgentId]);

  // ---- SAVE API KEYS ----
  const handleSaveApiKeys = useCallback(async () => {
    await updateVaultData(prev => ({
      ...prev,
      settings: {
        ...(prev.settings || {}),
        openai_api_key: apiKeys.openai.trim(),
        anthropic_api_key: apiKeys.anthropic.trim(),
        gemini_api_key: apiKeys.gemini.trim(),
        groq_api_key: apiKeys.groq.trim(),
        mistral_api_key: apiKeys.mistral.trim(),
        deepseek_api_key: apiKeys.deepseek.trim(),
        brave_api_key: apiKeys.brave.trim(),
      }
    }));

    try {
      await fetch("/api/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openai_api_key: apiKeys.openai.trim(),
          anthropic_api_key: apiKeys.anthropic.trim(),
          gemini_api_key: apiKeys.gemini.trim(),
          groq_api_key: apiKeys.groq.trim(),
          mistral_api_key: apiKeys.mistral.trim(),
          deepseek_api_key: apiKeys.deepseek.trim(),
          brave_api_key: apiKeys.brave.trim(),
        }),
      });
    } catch { /* ok */ }

    setShowApiKeyModal(false);
    setNeedsApiKeys(false);
    try {
      const res = await fetch("/api/health", { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      setGatewayStatus(data.status === "ready" ? "connected" : "offline");
    } catch { /* ignore */ }
  }, [apiKeys, updateVaultData]);

  // ---- SEND MESSAGE ----
  const sendCommand = useCallback(async (preset?: string) => {
    const text = (preset || input).trim();
    if (text === "" || sending) return;
    if (!canSendMessage) { setPaywallFeature("messages"); setShowPaywall(true); return; }

    let fullText = text;
    const currentPdf = uploadedPdf;
    if (currentPdf) {
      const pdfSnippet = currentPdf.text.length > 8000
        ? currentPdf.text.slice(0, 8000) + "\n...(truncated)"
        : currentPdf.text;
      fullText = `[Attached PDF: ${currentPdf.name}]\n\n${pdfSnippet}\n\n---\n\nUser question: ${text}`;
      setUploadedPdf(null);
    }

    const ts = new Date().toISOString();
    const uid = Date.now().toString();
    const pid = String(Date.now()+1);
    const userMsg: VaultMessage = {id:uid,role:"user",content:text + (currentPdf ? ` [PDF: ${currentPdf.name}]` : ""),timestamp:ts};
    const pendingMsg: VaultMessage = {id:pid,role:"ai",content:t.chat_processing,timestamp:ts,pending:true};
    setMessages(prev => [...prev, userMsg, pendingMsg]);
    setInput(""); setSending(true);
    setTimeout(() => inputRef.current?.focus(), 0);

    try {
      const currentAgent = getAgentById(activeAgentId, customAgents);
      const res = await fetch("/api/execute", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({command:fullText,persona:"operator",agentSystemPrompt:currentAgent?.systemPrompt})});
      const data = await res.json();
      if (!res.ok) {
        showError(`Gateway error: ${data.response || data.error || t.error_unknown}`);
        setMessages(prev => prev.map(m => m.id===pid ? {...m,role:"error",content:data.response || data.error || t.error_request_failed,pending:false} : m));
        return;
      }
      // Handle credit exhaustion
      if (data.creditExhausted) {
        setMessages(prev => prev.map(m => m.id===pid ? {...m,content:data.response,pending:false,timestamp:new Date().toISOString()} : m));
        setComputeUnits(prev => prev ? { ...prev, remaining: 0 } : null);
        return;
      }

      const reply = data.reply || data.response || data.result || "(no response)";
      setMessages(prev => {
        const updated = prev.map(m => m.id===pid ? {...m,content:reply,pending:false,timestamp:new Date().toISOString()} : m);
        // Update conversation
        setConversations(cs => cs.map(c =>
          c.id === activeConvoId ? { ...c, messages: updated, updatedAt: new Date().toISOString() } : c
        ));
        return updated;
      });
      incrementMessageCount();

      // Refresh compute units balance (desktop only, non-blocking)
      if (isElectron()) {
        fetch("/api/credits", { signal: AbortSignal.timeout(3000) })
          .then(r => r.json())
          .then(d => {
            if (d.remainingUnits !== undefined) {
              setComputeUnits({ remaining: d.remainingUnits, total: d.totalUnits, usingOwnKey: d.usingOwnKey });
            }
          })
          .catch(() => {});
      }
    } catch(e) {
      const errMsg = String(e);
      setMessages(prev => prev.map(m => m.id===pid ? {...m,role:"error",content:errMsg,pending:false} : m));
      showError(errMsg);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, sending, canSendMessage, incrementMessageCount, showError, uploadedPdf, activeConvoId, t.chat_processing]);

  // ---- VOICE INPUT ----
  const handleVoice = useCallback(async () => {
    if (!isFeatureAvailable("voice_input")) {
      setPaywallFeature("Voice Input"); setShowPaywall(true); return;
    }
    if (isListening && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop(); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setIsListening(false);
        mediaRecorderRef.current = null;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        if (audioBlob.size < 500) return;
        setInput(t.chat_transcribing);
        try {
          const formData = new FormData();
          const ext = mimeType.includes("mp4") ? "mp4" : "webm";
          formData.append("audio", audioBlob, `recording.${ext}`);
          const res = await fetch("/api/transcribe", { method: "POST", body: formData });
          const data = await res.json();
          if (res.ok && data.text) {
            setInput(data.text);
            setTimeout(() => inputRef.current?.focus(), 50);
          } else {
            showError(data.error || t.error_transcription_failed);
            setInput("");
          }
        } catch (err) {
          showError(t.error_transcription_error + ": " + String(err));
          setInput("");
        }
      };

      recorder.onerror = () => {
        stream.getTracks().forEach(track => track.stop());
        setIsListening(false); mediaRecorderRef.current = null;
        showError(t.error_voice_recording);
      };

      recorder.start(250);
      setIsListening(true);
    } catch (err) {
      const msg = (err as Error).message || String(err);
      if (msg.includes("Permission denied") || msg.includes("NotAllowedError")) {
        showError(t.error_voice_denied);
      } else {
        showError(t.error_voice_mic + ": " + msg);
      }
    }
  }, [isFeatureAvailable, isListening, showError, t]);

  // ---- PDF UPLOAD ----
  const handleUpload = useCallback(() => {
    if (!isFeatureAvailable("pdf_upload")) {
      setPaywallFeature("PDF Upload"); setShowPaywall(true); return;
    }
    fileInputRef.current?.click();
  }, [isFeatureAvailable]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) { showError(t.error_pdf_only); return; }
    if (file.size > 10 * 1024 * 1024) { showError(t.error_pdf_large); return; }
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/pdf-parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { showError(data.error || t.error_pdf_parse_failed); return; }
      setUploadedPdf({ name: file.name, text: data.text });
      setInput(prev => prev || t.chat_summarize_pdf);
      inputRef.current?.focus();
    } catch (err) {
      showError(t.error_pdf_upload_failed + ": " + String(err));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [showError, t]);

  // ---- GENERATE REPORT ----
  const handleGenerateReport = useCallback(async () => {
    if (!isFeatureAvailable("reports")) { setPaywallFeature("Reports"); setShowPaywall(true); return; }
    if (messages.length === 0) { showError(t.error_no_conversation); return; }
    const ts = new Date().toISOString();
    const uid = Date.now().toString();
    const pid = String(Date.now()+1);
    setMessages(prev => [...prev,
      {id:uid,role:"user",content:t.chat_generate_report,timestamp:ts},
      {id:pid,role:"ai",content:t.chat_generating_report,timestamp:ts,pending:true}
    ]);
    try {
      const completed = messages.filter(m => !m.pending && m.role !== "error");
      const res = await fetch("/api/report", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ messages: completed, reportType: "summary", timeRange: "this session" }),
      });
      const data = await res.json();
      if (res.ok && data.report) {
        setMessages(prev => prev.map(m => m.id===pid ? {...m,content:data.report,pending:false,timestamp:new Date().toISOString()} : m));
      } else {
        setMessages(prev => prev.map(m => m.id===pid ? {...m,role:"error",content:data.error || t.error_report_failed,pending:false} : m));
      }
    } catch(e) {
      setMessages(prev => prev.map(m => m.id===pid ? {...m,role:"error",content:String(e),pending:false} : m));
    }
  }, [messages, isFeatureAvailable, showError, t]);

  // ---- SHARE ----
  const handleShare = useCallback(async () => {
    if (!isFeatureAvailable("share")) { setPaywallFeature("Share"); setShowPaywall(true); return; }
    if (messages.length === 0) { showError(t.error_no_share); return; }
    try {
      const completed = messages.filter(m => !m.pending);
      const res = await fetch("/api/share", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ entries: completed.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })), expiresIn: 24 }),
      });
      const data = await res.json();
      if (res.ok && data.shareUrl) {
        const ts = new Date().toISOString();
        setMessages(prev => [...prev, {
          id: Date.now().toString(), role: "ai",
          content: `**Conversation shared!**\n\nLink: ${data.shareUrl}\n\nExpires in 24 hours. ${data.entryCount} messages shared.`,
          timestamp: ts,
        }]);
        try { await navigator.clipboard.writeText(data.shareUrl); } catch { /* ok */ }
      } else { showError(data.error || "Failed to create share link."); }
    } catch(e) { showError("Share failed: " + String(e)); }
  }, [messages, isFeatureAvailable, showError, t]);

  // ---- EXPORT CHAT ----
  const handleExportChat = useCallback(() => {
    if (messages.length === 0) { showError(t.error_no_share); return; }
    const lines = messages.filter(m => !m.pending).map(m => {
      const who = m.role === "user" ? "You" : "VaultAI";
      const time = m.timestamp ? new Date(m.timestamp).toLocaleString() : "";
      return `[${who}] ${time}\n${m.content}\n`;
    });
    const text = `VaultAI Chat Export\n${"=".repeat(40)}\n\n${lines.join("\n")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vaultai-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, showError, t]);

  // ---- CLEAR / NEW CHAT ----
  const handleClearChat = useCallback(() => {
    createNewConversation(null);
  }, [createNewConversation]);

  const statusDotClass = gatewayStatus === "connected" ? "dot connected" : gatewayStatus === "connecting" ? "dot connecting" : "dot offline";
  const statusLabel = gatewayStatus === "connected" ? t.topbar_connected : gatewayStatus === "connecting" ? t.topbar_connecting : t.topbar_offline;
  const hasMessages = messages.length > 0;

  // Group conversations for sidebar rendering
  const ungrouped = conversations.filter(c => !c.groupId);
  const grouped = groups.map(g => ({
    ...g,
    convos: conversations.filter(c => c.groupId === g.id),
  }));

  return (
    <div className="console-layout">
      <aside className="console-sidebar">
        {/* Top: Console + New Chat */}
        <div className="sidebar-section">
          <div className="sidebar-label">{t.sidebar_console.toUpperCase()}</div>
          <button className="sidebar-item active"><Terminal size={16} /> {t.sidebar_console}</button>
          <button className="sidebar-item" onClick={handleClearChat}><Plus size={16} /> {t.sidebar_new_chat}</button>
        </div>

        {/* Conversation list */}
        <div className="sidebar-section" style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div className="sidebar-label" style={{ marginBottom: 0 }}>{t.sidebar_chats}</div>
            <button
              className="ghost-btn"
              onClick={() => setShowNewGroup(true)}
              title={t.sidebar_new_group}
              style={{ padding: 2 }}
            >
              <FolderPlus size={14} />
            </button>
          </div>

          {/* New group inline input */}
          {showNewGroup && (
            <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
              <input
                autoFocus
                type="text"
                placeholder={t.sidebar_group_placeholder}
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") createGroup(); if (e.key === "Escape") setShowNewGroup(false); }}
                style={{
                  flex: 1, padding: "4px 8px", background: "var(--bg-tertiary, #111)",
                  border: "1px solid var(--border-subtle, #222)", borderRadius: 6,
                  color: "var(--text-primary)", fontSize: "0.75rem",
                }}
              />
              <button className="ghost-btn" onClick={createGroup} style={{ padding: 2 }}><Check size={14} /></button>
              <button className="ghost-btn" onClick={() => setShowNewGroup(false)} style={{ padding: 2 }}><X size={14} /></button>
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Ungrouped conversations */}
            {ungrouped.map(convo => (
              <div
                key={convo.id}
                className={"sidebar-item" + (convo.id === activeConvoId ? " active" : "")}
                onClick={() => switchConversation(convo.id)}
                onContextMenu={e => { e.preventDefault(); setRenamingId(convo.id); setRenameValue(convo.name); }}
                style={{ padding: "6px 10px", fontSize: "0.8rem", position: "relative", gap: 6 }}
              >
                <MessageSquare size={13} />
                {renamingId === convo.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") renameConversation(convo.id, renameValue); if (e.key === "Escape") setRenamingId(null); }}
                    onBlur={() => renameConversation(convo.id, renameValue)}
                    onClick={e => e.stopPropagation()}
                    style={{
                      flex: 1, background: "transparent", border: "none", borderBottom: "1px solid var(--accent)",
                      color: "var(--text-primary)", fontSize: "0.8rem", padding: 0, outline: "none",
                    }}
                  />
                ) : (
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{convo.name}</span>
                )}
                {conversations.length > 1 && convo.id !== activeConvoId && (
                  <button
                    className="ghost-btn"
                    onClick={e => { e.stopPropagation(); deleteConversation(convo.id); }}
                    style={{ padding: 1, opacity: 0.4 }}
                  ><X size={12} /></button>
                )}
              </div>
            ))}

            {/* Grouped conversations */}
            {grouped.map(g => (
              <div key={g.id} style={{ marginTop: 4 }}>
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 4, padding: "4px 8px",
                    fontSize: "0.7rem", color: "var(--text-muted)", cursor: "pointer",
                    textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600,
                  }}
                  onClick={() => toggleGroupCollapse(g.id)}
                >
                  <ChevronDown size={12} style={{ transform: g.collapsed ? "rotate(-90deg)" : "none", transition: "transform 0.15s" }} />
                  <span style={{ flex: 1 }}>{g.name}</span>
                  <button
                    className="ghost-btn"
                    onClick={e => { e.stopPropagation(); createNewConversation(g.id); }}
                    style={{ padding: 1 }}
                  ><Plus size={11} /></button>
                  <button
                    className="ghost-btn"
                    onClick={e => { e.stopPropagation(); deleteGroup(g.id); }}
                    style={{ padding: 1, opacity: 0.4 }}
                  ><X size={11} /></button>
                </div>
                {!g.collapsed && g.convos.map(convo => (
                  <div
                    key={convo.id}
                    className={"sidebar-item" + (convo.id === activeConvoId ? " active" : "")}
                    onClick={() => switchConversation(convo.id)}
                    onContextMenu={e => { e.preventDefault(); setRenamingId(convo.id); setRenameValue(convo.name); }}
                    style={{ padding: "5px 10px 5px 24px", fontSize: "0.78rem", gap: 6 }}
                  >
                    <MessageSquare size={12} />
                    {renamingId === convo.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") renameConversation(convo.id, renameValue); if (e.key === "Escape") setRenamingId(null); }}
                        onBlur={() => renameConversation(convo.id, renameValue)}
                        onClick={e => e.stopPropagation()}
                        style={{
                          flex: 1, background: "transparent", border: "none", borderBottom: "1px solid var(--accent)",
                          color: "var(--text-primary)", fontSize: "0.78rem", padding: 0, outline: "none",
                        }}
                      />
                    ) : (
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{convo.name}</span>
                    )}
                    <button
                      className="ghost-btn"
                      onClick={e => { e.stopPropagation(); deleteConversation(convo.id); }}
                      style={{ padding: 1, opacity: 0.4 }}
                    ><X size={12} /></button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Tab switcher for sidebar sections */}
        <div className="sidebar-section">
          <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
            <button
              onClick={() => setSidebarSection("commands")}
              style={{
                flex: 1, padding: "4px 0", fontSize: "0.65rem", textTransform: "uppercase",
                letterSpacing: "0.05em", background: sidebarSection === "commands" ? "var(--bg-tertiary)" : "transparent",
                border: "none", color: sidebarSection === "commands" ? "var(--accent)" : "var(--text-secondary)",
                borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 600,
              }}
            >
              {t.sidebar_commands}
            </button>
            <button
              onClick={() => setSidebarSection("agents")}
              style={{
                flex: 1, padding: "4px 0", fontSize: "0.65rem", textTransform: "uppercase",
                letterSpacing: "0.05em", background: sidebarSection === "agents" ? "var(--bg-tertiary)" : "transparent",
                border: "none", color: sidebarSection === "agents" ? "var(--accent)" : "var(--text-secondary)",
                borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 600,
              }}
            >
              {t.sidebar_tools}
            </button>
          </div>

          {sidebarSection === "commands" && (
            <>
              {/* Agent-specific quick commands */}
              {(() => {
                const agent = getAgentById(activeAgentId, customAgents);
                if (agent && agent.id !== "general" && agent.quickCommands.length > 0) {
                  return (
                    <>
                      <div className="sidebar-label" style={{ color: agent.color }}>{agent.name.toUpperCase()}</div>
                      {agent.quickCommands.map(qc => (
                        <button key={qc.label} className="sidebar-item" onClick={() => {
                          if (qc.cmd.endsWith(" ")) { setInput(qc.cmd); inputRef.current?.focus(); }
                          else sendCommand(qc.cmd);
                        }}>
                          <ChevronRight size={14} /> {qc.label}
                        </button>
                      ))}
                      <div style={{ height: 8 }} />
                    </>
                  );
                }
                return null;
              })()}
              <div className="sidebar-label">{t.sidebar_quick_commands}</div>
              {[
                { label: t.sidebar_status, cmd: "status", icon: <Zap size={14} /> },
                { label: t.sidebar_help, cmd: t.cmd_help, icon: <ChevronRight size={14} /> },
                { label: t.sidebar_summarize, cmd: t.cmd_summarize, icon: <ChevronRight size={14} /> },
                { label: t.sidebar_search, cmd: null, icon: <Search size={14} /> },
              ].map(item => (
                <button key={item.label} className="sidebar-item" onClick={() => {
                  if (item.cmd) { sendCommand(item.cmd); }
                  else { setInput("search "); inputRef.current?.focus(); }
                }}>{item.icon} {item.label}</button>
              ))}
              <div style={{ height: 8 }} />
              <div className="sidebar-label">{t.sidebar_tools_label}</div>
              <button className="sidebar-item" onClick={() => sendCommand("status")}><Settings size={14} /> {t.sidebar_system_status}</button>
              <button className="sidebar-item" onClick={() => sendCommand("Tell me about myself")}><User size={14} /> {t.sidebar_my_persona}</button>
              <button className="sidebar-item" onClick={handleGenerateReport}><BarChart3 size={14} /> {t.sidebar_generate_report}</button>
              <button className="sidebar-item" onClick={handleShare}><Share2 size={14} /> {t.sidebar_share_chat}</button>
              <button className="sidebar-item" onClick={handleExportChat}><Download size={14} /> {t.sidebar_export_chat}</button>
              <button className="sidebar-item" onClick={handleUpload}><Paperclip size={14} /> {t.sidebar_upload_pdf}</button>
              <button className="sidebar-item" onClick={() => setShowApiKeyModal(true)}><Key size={14} /> {t.sidebar_api_keys}</button>
            </>
          )}

          {sidebarSection === "agents" && (
            <>
              <div className="sidebar-label">{t.sidebar_agents_label}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 320, overflowY: "auto" }}>
                {[...BUILT_IN_AGENTS, ...customAgents].map(agent => (
                  <div
                    key={agent.id}
                    onClick={() => setActiveAgentId(agent.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                      background: activeAgentId === agent.id ? "var(--bg-tertiary)" : "transparent",
                      border: activeAgentId === agent.id ? `1px solid ${agent.color}33` : "1px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
                      background: `${agent.color}18`, color: agent.color, flexShrink: 0,
                    }}>
                      <AgentIcon name={agent.icon} size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "0.8rem", fontWeight: 600,
                        color: activeAgentId === agent.id ? "var(--text-primary)" : "var(--text-secondary)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {agent.name}
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {agent.tagline}
                      </div>
                    </div>
                    {activeAgentId === agent.id && (
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: agent.color, flexShrink: 0 }} />
                    )}
                    {agent.custom && (
                      <button
                        className="ghost-btn"
                        onClick={e => { e.stopPropagation(); handleDeleteCustomAgent(agent.id); }}
                        style={{ padding: 2, opacity: 0.4 }}
                      ><X size={11} /></button>
                    )}
                  </div>
                ))}
              </div>
              <button
                className="sidebar-item"
                onClick={() => setShowCreateAgent(true)}
                style={{ marginTop: 8, color: "var(--accent)", fontSize: "0.78rem" }}
              >
                <Plus size={14} /> {t.sidebar_create_agent}
              </button>
              <div style={{ marginTop: 12, padding: "8px 10px", background: "var(--bg-tertiary)", borderRadius: 8, fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--text-secondary)" }}>{t.sidebar_agents_help_title}</strong> {t.sidebar_agents_help_text}
              </div>
            </>
          )}
        </div>

        {/* Language picker */}
        <div style={{ position: "relative" }}>
          <button
            className="sidebar-item"
            onClick={() => setShowLangPicker(!showLangPicker)}
            style={{ fontSize: "0.8rem", padding: "8px 12px" }}
          >
            <Globe size={14} /> {t.sidebar_language}: {LOCALE_LABELS[locale]}
          </button>
          {showLangPicker && (
            <div style={{
              position: "absolute", bottom: "100%", left: 0, right: 0,
              background: "var(--bg-card, #111)", border: "1px solid var(--border-color, #1a1a1a)",
              borderRadius: 8, padding: 4, zIndex: 50, maxHeight: 240, overflowY: "auto",
              boxShadow: "0 -8px 24px rgba(0,0,0,0.5)",
            }}>
              {(Object.keys(LOCALE_LABELS) as Locale[]).map(loc => (
                <button
                  key={loc}
                  onClick={() => { setLocale(loc); setShowLangPicker(false); }}
                  style={{
                    display: "block", width: "100%", padding: "6px 10px", background: loc === locale ? "var(--accent-subtle)" : "transparent",
                    border: "none", color: loc === locale ? "var(--accent)" : "var(--text-secondary)",
                    fontSize: "0.8rem", textAlign: "left", borderRadius: 6, cursor: "pointer",
                  }}
                >
                  {LOCALE_LABELS[loc]}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="sidebar-lock" onClick={handleLock}><Lock size={16} /> {t.sidebar_lock}</button>
      </aside>
      <div className="console-main" style={{position:"relative"}}>
        <header className="console-topbar">
          <div className="topbar-brand"><Lock size={18} /><span>VAULTAI</span></div>
          <div className="topbar-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {(() => {
              const agent = getAgentById(activeAgentId, customAgents);
              if (agent && agent.id !== "general") {
                return (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: agent.color, fontSize: "0.8rem", fontWeight: 600 }}>
                    <AgentIcon name={agent.icon} size={14} />
                    {agent.name}
                  </span>
                );
              }
              return <span>{t.chat_title}</span>;
            })()}
          </div>
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
          {/* Onboarding flow — premium first-run experience */}
          {onboardingStep >= 0 && (
            <div className="empty-state" style={{ gap: 0, paddingTop: 40 }}>
              {/* Animated lock with glow ring */}
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.12)",
                display: "grid", placeItems: "center", marginBottom: 20,
                position: "relative",
                animation: "lockBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
              }}>
                <Lock size={32} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
                <div style={{
                  position: "absolute", inset: -6, borderRadius: 24,
                  background: "radial-gradient(circle, rgba(0,255,136,0.08), transparent 70%)",
                  animation: "vaultIconGlow 3s ease-in-out infinite",
                  zIndex: -1,
                }} />
              </div>

              <h2 className="empty-title" style={{ marginBottom: 6, fontSize: "1.4rem" }}>{t.onboarding_title}</h2>

              {/* Progress dots */}
              <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
                {ONBOARDING_STEPS.map((_, i) => (
                  <div key={i} style={{
                    width: i <= onboardingStep ? 20 : 8, height: 4,
                    borderRadius: 4,
                    background: i < onboardingStep ? "var(--accent)" : i === onboardingStep ? "rgba(0,255,136,0.5)" : "rgba(255,255,255,0.08)",
                    transition: "all 0.3s ease",
                  }} />
                ))}
              </div>

              {/* Previous answers shown as compact chips */}
              {onboardingStep > 0 && (
                <div style={{ width: "100%", maxWidth: 460, display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20, justifyContent: "center" }}>
                  {ONBOARDING_STEPS.slice(0, onboardingStep).map(step => (
                    <div key={step.key} style={{
                      padding: "6px 14px",
                      background: "rgba(0,255,136,0.04)",
                      border: "1px solid rgba(0,255,136,0.08)",
                      borderRadius: 20, fontSize: "0.8rem", color: "var(--accent-muted)",
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{step.key}:</span>
                      {onboardingAnswers[step.key]}
                    </div>
                  ))}
                </div>
              )}

              {/* Current question */}
              <div style={{ width: "100%", maxWidth: 460 }}>
                <p style={{
                  fontSize: "1.15rem", fontWeight: 600, color: "var(--text-primary)",
                  marginBottom: 14, lineHeight: 1.4,
                }}>
                  {ONBOARDING_STEPS[onboardingStep].q}
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder={ONBOARDING_STEPS[onboardingStep].placeholder}
                    value={onboardingInput}
                    onChange={e => setOnboardingInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleOnboardingSubmit(); }}
                    style={{
                      flex: 1, padding: "12px 16px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      color: "var(--text-primary)", fontSize: "0.92rem",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                      outline: "none",
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = "rgba(0,255,136,0.3)";
                      e.target.style.boxShadow = "0 0 0 2px rgba(0,255,136,0.08)";
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = "rgba(255,255,255,0.08)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <button
                    onClick={handleOnboardingSubmit}
                    disabled={!onboardingInput.trim()}
                    style={{
                      padding: "12px 18px", background: "var(--accent)", color: "#000",
                      border: "none", borderRadius: 12, fontWeight: 600,
                      cursor: onboardingInput.trim() ? "pointer" : "not-allowed",
                      opacity: onboardingInput.trim() ? 1 : 0.3,
                      transition: "all 0.2s ease",
                      boxShadow: onboardingInput.trim() ? "0 2px 12px rgba(0,255,136,0.2)" : "none",
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
                {onboardingStep > 0 && (
                  <button
                    onClick={() => setOnboardingStep(-1)}
                    style={{
                      marginTop: 18, background: "none", border: "none",
                      color: "var(--text-muted)", fontSize: "0.75rem",
                      cursor: "pointer", letterSpacing: "0.05em",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = "var(--text-secondary)"}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = "var(--text-muted)"}
                  >
                    {t.onboarding_skip}
                  </button>
                )}
              </div>
            </div>
          )}

          {onboardingStep < 0 && !hasMessages && (
            <div className="empty-state">
              {(() => {
                const agent = getAgentById(activeAgentId, customAgents);
                if (agent && agent.id !== "general") {
                  return (
                    <>
                      <div style={{
                        width: 64, height: 64, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
                        background: `${agent.color}18`, color: agent.color, marginBottom: 12,
                      }}>
                        <AgentIcon name={agent.icon} size={32} />
                      </div>
                      <h2 className="empty-title" style={{ color: agent.color }}>{agent.name}</h2>
                      <p className="empty-subtitle">{agent.tagline}</p>
                      <div className="prompt-pills">
                        {agent.quickCommands.slice(0, 4).map(qc => (
                          <button key={qc.label} className="prompt-pill" onClick={() => {
                            if (qc.cmd.endsWith(" ")) { setInput(qc.cmd); inputRef.current?.focus(); }
                            else sendCommand(qc.cmd);
                          }}>{qc.label}</button>
                        ))}
                      </div>
                    </>
                  );
                }
                return (
                  <>
                    <Lock size={64} strokeWidth={1} style={{ color: "var(--accent)", opacity: 0.4 }} />
                    <h2 className="empty-title">{t.chat_empty_title}</h2>
                    <p className="empty-subtitle">{t.chat_empty_subtitle}</p>
                    <div className="prompt-pills">
                      {PROMPT_PILLS.map(pill => (
                        <button key={pill} className="prompt-pill" onClick={() => sendCommand(pill)}>{pill}</button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={"console-message " + msg.role + (msg.pending ? " pending" : "")}>
              <div className="message-meta"><span>{msg.role==="user" ? t.chat_you : (getAgentById(activeAgentId, customAgents)?.name?.toLowerCase() || t.chat_ai)}</span></div>
              <div><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
              {msg.pending && <div className="message-status">{t.chat_processing}</div>}
            </div>
          ))}
        </div>

        {/* API Key Configuration Modal — premium welcome flow */}
        {showApiKeyModal && (
          <div className="onboarding-overlay" onClick={() => { if (!needsApiKeys) setShowApiKeyModal(false); }}>
            <div className="onboarding-modal" onClick={e => e.stopPropagation()} style={{maxWidth:520}}>
              {/* Welcome header for first-time setup */}
              {needsApiKeys && (
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <Lock size={36} strokeWidth={1.5} style={{ color: "var(--accent)", marginBottom: 12 }} />
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>
                    {t.apikeys_welcome_title}
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    {t.apikeys_welcome_subtitle}
                    <br />{t.apikeys_welcome_keys_note}
                  </p>
                </div>
              )}
              {/* Regular header for manual key config */}
              {!needsApiKeys && (
                <div className="onboarding-header">
                  <Key size={20} />
                  <h3>{t.apikeys_title}</h3>
                  <button className="ghost-btn" onClick={() => setShowApiKeyModal(false)}><X size={16} /></button>
                </div>
              )}
              {!needsApiKeys && <p className="onboarding-subtitle" style={{marginBottom:16}}>{t.apikeys_subtitle}</p>}

              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <label style={{display:"block",fontSize:"0.8rem",color:"var(--text-secondary)",marginBottom:4,fontWeight:600}}>
                    {t.apikeys_openai_label} <span style={{color:"var(--accent)",fontSize:"0.7rem"}}>{t.apikeys_openai_rec}</span>
                  </label>
                  <input type="password" placeholder="sk-..." value={apiKeys.openai}
                    autoFocus={needsApiKeys}
                    onChange={e => setApiKeys(prev => ({...prev, openai: e.target.value}))}
                    style={{ width:"100%",padding:"10px 12px",background:"var(--bg-tertiary)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-md)",color:"var(--text-primary)",fontSize:"0.85rem",fontFamily:"var(--font-mono)" }} />
                  <span style={{fontSize:"0.7rem",color:"var(--text-secondary)"}}>{t.apikeys_openai_hint}</span>
                </div>
                <div>
                  <label style={{display:"block",fontSize:"0.8rem",color:"var(--text-secondary)",marginBottom:4,fontWeight:600}}>
                    {t.apikeys_anthropic_label} <span style={{fontSize:"0.7rem"}}>{t.apikeys_anthropic_opt}</span>
                  </label>
                  <input type="password" placeholder="sk-ant-..." value={apiKeys.anthropic}
                    onChange={e => setApiKeys(prev => ({...prev, anthropic: e.target.value}))}
                    style={{ width:"100%",padding:"10px 12px",background:"var(--bg-tertiary)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-md)",color:"var(--text-primary)",fontSize:"0.85rem",fontFamily:"var(--font-mono)" }} />
                  <span style={{fontSize:"0.7rem",color:"var(--text-secondary)"}}>{t.apikeys_anthropic_hint}</span>
                </div>
                <div>
                  <label style={{display:"block",fontSize:"0.8rem",color:"var(--text-secondary)",marginBottom:4,fontWeight:600}}>
                    {t.apikeys_gemini_label} <span style={{fontSize:"0.7rem"}}>{t.apikeys_gemini_opt}</span>
                  </label>
                  <input type="password" placeholder="AIza..." value={apiKeys.gemini}
                    onChange={e => setApiKeys(prev => ({...prev, gemini: e.target.value}))}
                    style={{ width:"100%",padding:"10px 12px",background:"var(--bg-tertiary)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-md)",color:"var(--text-primary)",fontSize:"0.85rem",fontFamily:"var(--font-mono)" }} />
                  <span style={{fontSize:"0.7rem",color:"var(--text-secondary)"}}>{t.apikeys_gemini_hint}</span>
                </div>
                <div>
                  <label style={{display:"block",fontSize:"0.8rem",color:"var(--text-secondary)",marginBottom:4,fontWeight:600}}>
                    {t.apikeys_groq_label} <span style={{fontSize:"0.7rem"}}>{t.apikeys_groq_opt}</span>
                  </label>
                  <input type="password" placeholder="gsk_..." value={apiKeys.groq}
                    onChange={e => setApiKeys(prev => ({...prev, groq: e.target.value}))}
                    style={{ width:"100%",padding:"10px 12px",background:"var(--bg-tertiary)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-md)",color:"var(--text-primary)",fontSize:"0.85rem",fontFamily:"var(--font-mono)" }} />
                  <span style={{fontSize:"0.7rem",color:"var(--text-secondary)"}}>{t.apikeys_groq_hint}</span>
                </div>
                <div>
                  <label style={{display:"block",fontSize:"0.8rem",color:"var(--text-secondary)",marginBottom:4,fontWeight:600}}>
                    {t.apikeys_mistral_label} <span style={{fontSize:"0.7rem"}}>{t.apikeys_mistral_opt}</span>
                  </label>
                  <input type="password" placeholder="..." value={apiKeys.mistral}
                    onChange={e => setApiKeys(prev => ({...prev, mistral: e.target.value}))}
                    style={{ width:"100%",padding:"10px 12px",background:"var(--bg-tertiary)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-md)",color:"var(--text-primary)",fontSize:"0.85rem",fontFamily:"var(--font-mono)" }} />
                  <span style={{fontSize:"0.7rem",color:"var(--text-secondary)"}}>{t.apikeys_mistral_hint}</span>
                </div>
                <div>
                  <label style={{display:"block",fontSize:"0.8rem",color:"var(--text-secondary)",marginBottom:4,fontWeight:600}}>
                    {t.apikeys_deepseek_label} <span style={{fontSize:"0.7rem"}}>{t.apikeys_deepseek_opt}</span>
                  </label>
                  <input type="password" placeholder="sk-..." value={apiKeys.deepseek}
                    onChange={e => setApiKeys(prev => ({...prev, deepseek: e.target.value}))}
                    style={{ width:"100%",padding:"10px 12px",background:"var(--bg-tertiary)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-md)",color:"var(--text-primary)",fontSize:"0.85rem",fontFamily:"var(--font-mono)" }} />
                  <span style={{fontSize:"0.7rem",color:"var(--text-secondary)"}}>{t.apikeys_deepseek_hint}</span>
                </div>
                <div>
                  <label style={{display:"block",fontSize:"0.8rem",color:"var(--text-secondary)",marginBottom:4,fontWeight:600}}>
                    {t.apikeys_brave_label} <span style={{fontSize:"0.7rem"}}>{t.apikeys_brave_opt}</span>
                  </label>
                  <input type="password" placeholder="BSA..." value={apiKeys.brave}
                    onChange={e => setApiKeys(prev => ({...prev, brave: e.target.value}))}
                    style={{ width:"100%",padding:"10px 12px",background:"var(--bg-tertiary)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-md)",color:"var(--text-primary)",fontSize:"0.85rem",fontFamily:"var(--font-mono)" }} />
                  <span style={{fontSize:"0.7rem",color:"var(--text-secondary)"}}>{t.apikeys_brave_hint}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:12,marginTop:18}}>
                <button className="share-create-btn" onClick={handleSaveApiKeys} style={{flex:1, padding: needsApiKeys ? "12px 0" : undefined, fontSize: needsApiKeys ? "0.95rem" : undefined}}
                  disabled={!apiKeys.openai.trim() && !apiKeys.anthropic.trim() && !apiKeys.gemini.trim() && !apiKeys.groq.trim() && !apiKeys.mistral.trim() && !apiKeys.deepseek.trim()}>
                  {needsApiKeys ? t.apikeys_connect_start : t.apikeys_save}
                </button>
                {!needsApiKeys && (
                  <button className="ghost-btn" onClick={() => setShowApiKeyModal(false)} style={{flex:1}}>
                    {t.apikeys_later}
                  </button>
                )}
              </div>
              {needsApiKeys && (
                <button
                  onClick={() => { setShowApiKeyModal(false); setNeedsApiKeys(false); }}
                  style={{
                    display: "block", width: "100%", marginTop: 12, background: "none", border: "none",
                    color: "var(--text-secondary)", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline",
                  }}
                >
                  {t.apikeys_skip_later}
                </button>
              )}
              <p style={{fontSize:"0.7rem",color:"var(--text-secondary)",marginTop:12,textAlign:"center"}}>
                {t.apikeys_footer}
              </p>
            </div>
          </div>
        )}

        {/* Paywall Modal */}
        {showPaywall && (
          <div className="onboarding-overlay" onClick={() => setShowPaywall(false)}>
            <div className="onboarding-modal" onClick={e => e.stopPropagation()} style={{maxWidth:420}}>
              <div className="onboarding-header"><Lock size={20} /><h3>{t.paywall_title}</h3><button className="ghost-btn" onClick={() => setShowPaywall(false)}><X size={16} /></button></div>
              <p className="onboarding-subtitle" style={{marginBottom:16}}>
                {paywallFeature==="messages" ? t.paywall_messages : t.paywall_feature(paywallFeature)}
              </p>
              <div style={{display:"flex",gap:12}}>
                <a href="/#pricing" target="_blank" rel="noopener noreferrer" className="share-create-btn" style={{flex:1,textAlign:"center",textDecoration:"none"}}>{t.paywall_view}</a>
                <button className="ghost-btn" onClick={() => setShowPaywall(false)} style={{flex:1}}>{t.paywall_later}</button>
              </div>
            </div>
          </div>
        )}

        {/* Create Custom Agent Modal */}
        {showCreateAgent && (
          <div className="onboarding-overlay" onClick={() => setShowCreateAgent(false)}>
            <div className="onboarding-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div className="onboarding-header">
                <Bot size={20} />
                <h3>{t.agent_create_title}</h3>
                <button className="ghost-btn" onClick={() => setShowCreateAgent(false)}><X size={16} /></button>
              </div>
              <p className="onboarding-subtitle" style={{ marginBottom: 16 }}>
                {t.agent_create_subtitle}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 4, fontWeight: 600 }}>
                    {t.agent_name_label} <span style={{ color: "var(--accent)", fontSize: "0.7rem" }}>{t.agent_required}</span>
                  </label>
                  <input
                    type="text" placeholder={t.agent_name_placeholder}
                    value={newAgent.name}
                    onChange={e => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "0.85rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 4, fontWeight: 600 }}>
                    {t.agent_tagline_label}
                  </label>
                  <input
                    type="text" placeholder={t.agent_tagline_placeholder}
                    value={newAgent.tagline}
                    onChange={e => setNewAgent(prev => ({ ...prev, tagline: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "0.85rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 4, fontWeight: 600 }}>
                    {t.agent_expertise_label} <span style={{ color: "var(--accent)", fontSize: "0.7rem" }}>{t.agent_required}</span>
                  </label>
                  <textarea
                    placeholder={t.agent_expertise_placeholder}
                    value={newAgent.expertise}
                    onChange={e => setNewAgent(prev => ({ ...prev, expertise: e.target.value }))}
                    rows={2}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "0.85rem", resize: "vertical" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 4, fontWeight: 600 }}>
                    {t.agent_personality_label}
                  </label>
                  <input
                    type="text" placeholder={t.agent_personality_placeholder}
                    value={newAgent.personality}
                    onChange={e => setNewAgent(prev => ({ ...prev, personality: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "0.85rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 4, fontWeight: 600 }}>
                    {t.agent_instructions_label}
                  </label>
                  <textarea
                    placeholder={t.agent_instructions_placeholder}
                    value={newAgent.instructions}
                    onChange={e => setNewAgent(prev => ({ ...prev, instructions: e.target.value }))}
                    rows={2}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "0.85rem", resize: "vertical" }}
                  />
                </div>
                {/* Icon + Color picker */}
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 4, fontWeight: 600 }}>{t.agent_icon_label}</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {CUSTOM_AGENT_ICONS.map(iconName => (
                        <button
                          key={iconName}
                          onClick={() => setNewAgent(prev => ({ ...prev, icon: iconName }))}
                          style={{
                            width: 32, height: 32, borderRadius: 6, border: newAgent.icon === iconName ? `2px solid ${newAgent.color}` : "1px solid var(--border-subtle)",
                            background: newAgent.icon === iconName ? `${newAgent.color}18` : "var(--bg-tertiary)",
                            color: newAgent.icon === iconName ? newAgent.color : "var(--text-secondary)",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <AgentIcon name={iconName} size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 4, fontWeight: 600 }}>{t.agent_color_label}</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {CUSTOM_AGENT_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setNewAgent(prev => ({ ...prev, color: c }))}
                          style={{
                            width: 28, height: 28, borderRadius: 14, border: newAgent.color === c ? "2px solid var(--text-primary)" : "2px solid transparent",
                            background: c, cursor: "pointer",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                <button
                  className="share-create-btn"
                  onClick={handleCreateAgent}
                  disabled={!newAgent.name.trim() || !newAgent.expertise.trim()}
                  style={{ flex: 1 }}
                >
                  {t.agent_create_btn}
                </button>
                <button className="ghost-btn" onClick={() => setShowCreateAgent(false)} style={{ flex: 1 }}>
                  {t.agent_cancel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input for PDF upload */}
        <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFileChange} />
        <div className="console-input">
          {uploadedPdf && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px", background: "var(--accent-subtle)",
              borderRadius: "var(--radius-md)", fontSize: "0.8rem",
              color: "var(--accent)", border: "1px solid rgba(0,255,136,0.2)"
            }}>
              <Paperclip size={14} />
              <span>{uploadedPdf.name}</span>
              <button onClick={() => setUploadedPdf(null)}
                style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              ><X size={14} /></button>
            </div>
          )}
          <div className="input-bar">
            <button type="button" className={`ghost-btn${isListening ? " listening" : ""}`}
              onClick={handleVoice} title={isListening ? t.voice_stop : t.voice_start}
              style={isListening ? { color: "var(--danger)", animation: "pulse 1s infinite" } : undefined}>
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button type="button" className="ghost-btn" onClick={handleUpload} title={t.sidebar_upload_pdf}><Paperclip size={18} /></button>
            <textarea
              ref={inputRef}
              placeholder={isListening ? t.chat_placeholder_recording : t.chat_placeholder}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey){e.preventDefault();sendCommand();} }}
              disabled={sending}
            />
            <button type="button" className="send-btn" onClick={() => sendCommand()} disabled={sending || !input.trim()}><Send size={18} /></button>
          </div>
          <div className="console-footer">
            <span className="dot" /> {t.chat_footer_encrypted}
            {desktop
              ? <>
                  <span style={{marginLeft:12,color:"var(--accent)"}}>{t.chat_footer_premium}</span>
                  {computeUnits && !computeUnits.usingOwnKey && (
                    <span style={{
                      marginLeft: 12,
                      color: computeUnits.remaining <= 50 ? "var(--danger, #ff4444)" : "var(--text-secondary)",
                    }}>
                      {computeUnits.remaining} {t.compute_units}
                      {computeUnits.remaining <= 50 && computeUnits.remaining > 0 && ` — ${t.compute_running_low}`}
                      {computeUnits.remaining <= 0 && ` — ${t.compute_add_key}`}
                    </span>
                  )}
                  {computeUnits?.usingOwnKey && (
                    <span style={{ marginLeft: 12, color: "var(--text-secondary)" }}>{t.compute_own_key}</span>
                  )}
                </>
              : subscription.active
                ? <span style={{marginLeft:12,color:"var(--accent)"}}>{subscription.tier==="premium" ? ` ${t.chat_footer_premium}` : ` ${t.chat_footer_lite}`}</span>
                : <span style={{marginLeft:12}}>{freeLeft > 0 ? t.chat_footer_free_left(freeLeft) : t.chat_footer_free_limit}</span>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
