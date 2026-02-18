// 🔨🔐 HammerLock AI — Chat Console
// Where the magic happens. Privacy-first, personality-loaded.
"use client";
import {
  Lock, Mic, MicOff, Paperclip, Send, Terminal, X, ChevronRight, Trash2,
  FileText, Share2, User, Search, BarChart3, Bot, Zap, Globe, Settings, Key,
  Plus, FolderPlus, MessageSquare, ChevronDown, Edit3, Check, Download,
  Copy, Volume2, VolumeX, RefreshCw, Menu, PanelLeftClose, Archive,
  Shield, StickyNote, File, Image,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSubscription, FREE_MESSAGE_LIMIT } from "@/lib/subscription-store";
import { useVault, type VaultMessage, type VaultFile } from "@/lib/vault-store";
import { useRouter } from "next/navigation";
import { useI18n, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import {
  BUILT_IN_AGENTS, DEFAULT_AGENT_ID, getAgentById, buildCustomAgent,
  CUSTOM_AGENT_ICONS, CUSTOM_AGENT_COLORS,
  type AgentDef, type CustomAgentInput,
} from "@/lib/agents";
import { useNudges, type NudgeDef } from "@/lib/use-nudges";
import NudgeToast from "@/components/NudgeToast";
import SettingsPanel from "@/components/SettingsPanel";
import SourcesAccordion from "@/components/SourcesAccordion";
import PersonalVaultPanel from "@/components/PersonalVaultPanel";
import { usePersonalVault } from "@/lib/personal-vault-store";
import { type ScheduledTask, formatSchedule, formatTime12h } from "@/lib/schedules";

type GatewayStatus = "connected" | "connecting" | "offline";

// OpenClaw action badge display maps
const ACTION_BADGE_ICONS: Record<string, string> = {
  reminder: "⏰", email: "📧", message: "💬", notes: "📝",
  calendar: "📅", smart_home: "💡", github: "🐙", todo: "✅",
  camera: "📷", summarize_url: "🔗",
};
const ACTION_BADGE_LABELS: Record<string, string> = {
  reminder: "Reminder", email: "Email", message: "Message Sent",
  notes: "Note Created", calendar: "Calendar", smart_home: "Smart Home",
  github: "GitHub", todo: "Todo", camera: "Camera", summarize_url: "Summarized",
};

/** Nudge catalog — proactive tips shown at the right moment */
const NUDGE_CATALOG: Record<string, NudgeDef> = {
  remember_tip: {
    id: "remember_tip",
    icon: "🧠",
    message: "Teach me about yourself! Say \"remember: I live in Austin\" or any detail — I'll use it to personalize every response.",
    ctaLabel: "Try it \u2192",
    ctaCommand: "remember: ",
  },
  search_tip: {
    id: "search_tip",
    icon: "🌐",
    message: "I can search the web! Try asking about weather, news, restaurants, or anything that needs real-time data.",
    ctaLabel: "Try a search \u2192",
    ctaCommand: "search ",
  },
  voice_tip: {
    id: "voice_tip",
    icon: "🎙\uFE0F",
    message: "You can talk to me! Click the mic button to use voice input, or say \"read it out loud\" to hear my response.",
  },
  vault_tip: {
    id: "vault_tip",
    icon: "📎",
    message: "Upload PDFs and images with the paperclip button — I'll analyze them and store them encrypted on your device.",
  },
  agents_tip: {
    id: "agents_tip",
    icon: "🤖",
    message: "You're chatting with the general assistant. Try a specialist! Strategist does competitive analysis, Counsel handles legal research, Analyst builds financial models, and Writer polishes your drafts.",
    ctaLabel: "Browse Agents \u2192",
    ctaCommand: "__open_agents_tab__",
  },
  agent_deep_tip: {
    id: "agent_deep_tip",
    icon: "📄",
    message: "Pro tip: Upload a PDF and switch to the right agent \u2014 Counsel for contracts, Analyst for financials, Researcher for academic papers. Each agent reads the file through its specialist lens.",
  },
};

/** Fun thinking messages shown while AI is processing */
const THINKING_MESSAGES = [
  "Cooking up something good...",
  "Hmm, let me think about that...",
  "Crunching the numbers...",
  "Digging through the archives...",
  "Putting the pieces together...",
  "Working my magic...",
  "On it, one sec...",
  "Consulting the oracle...",
  "Brewing up an answer...",
  "Let me look into that...",
  "Neurons firing...",
  "Connecting the dots...",
  "Hold tight, almost there...",
  "Shuffling through the data...",
  "Thinking cap: ON...",
  "🔨 Hammering it out...",
  "🔨 Forging your answer...",
  "🔨 Nailing this down...",
  "🔨 Striking while the iron's hot...",
  "🔨 Drop the hammer in 3... 2...",
];
function getThinkingMessage() {
  return THINKING_MESSAGES[Math.floor(Math.random() * THINKING_MESSAGES.length)];
}

/** Simple emoji-based agent icon to avoid lucide barrel import issues in dev */
const AGENT_EMOJI: Record<string, string> = {
  Terminal: "\u2318", Target: "\uD83C\uDFAF", Scale: "\u2696\uFE0F", TrendingUp: "\uD83D\uDCC8",
  BookOpen: "\uD83D\uDCDA", Wrench: "\uD83D\uDD27", PenTool: "\u270D\uFE0F",
  Bot: "\uD83E\uDD16", Brain: "\uD83E\uDDE0", Cpu: "\uD83D\uDCBB", Flame: "\uD83D\uDD25",
  Heart: "\u2764\uFE0F", Lightbulb: "\uD83D\uDCA1", Rocket: "\uD83D\uDE80", Shield: "\uD83D\uDEE1\uFE0F",
  Star: "\u2B50", Wand2: "\u2728", Zap: "\u26A1",
  Wallet: "\uD83D\uDCB0", Megaphone: "\uD83D\uDCE3", Sword: "\u2694\uFE0F",
};
function AgentIcon({ name, size = 14 }: { name: string; size?: number }) {
  const emoji = AGENT_EMOJI[name] || "\uD83E\uDD16";
  return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>{emoji}</span>;
}

/** Agent onboarding tips — shown on first switch to each agent */
const AGENT_INTRO_TIPS: Record<string, { tips: string[]; example: string }> = {
  coach: {
    tips: [
      "Tell Coach about your fitness level and any injuries — it'll customize everything for you",
      "Ask for quick workouts when you're short on time: \"Give me a 15-min full body workout\"",
      "Get meal plans based on what you have: \"I have chicken, rice, and veggies — plan my week\"",
    ],
    example: "I'm a beginner, no gym — just dumbbells at home. Build me a 4-week plan to get stronger, 30 min/day.",
  },
  money: {
    tips: [
      "Start with the basics: \"I make $X/month after taxes\" — Money does the math from there",
      "Be honest about debt — no judgment, just a plan: \"I owe $12K across 3 credit cards\"",
      "Ask it to find savings: \"Where am I overspending?\" — paste your expenses and let it analyze",
    ],
    example: "I make $4,200/mo after taxes. Rent is $1,400, car is $380. Help me budget the rest and start saving.",
  },
  content: {
    tips: [
      "Always mention the platform — Instagram captions are different from LinkedIn posts",
      "Describe your vibe: \"casual and funny\" vs \"professional and authoritative\" changes everything",
      "Ask for bulk content: \"Give me 10 hooks\" or \"Plan a week of posts\" to batch your content creation",
    ],
    example: "I run a small bakery. Give me 5 Instagram captions for this week — fun, casual, with CTAs to order online.",
  },
  strategist: {
    tips: [
      "Start by describing your business in 2\u20133 sentences \u2014 Strategist remembers context for the whole conversation",
      "Ask it to challenge your assumptions: \"What am I missing in this plan?\"",
      "Use it for framework-driven analysis: \"Run a SWOT\" or \"Map my competitive landscape\"",
    ],
    example: "I'm launching a B2B SaaS for compliance teams in fintech. Help me map the competitive landscape and find the gaps.",
  },
  counsel: {
    tips: [
      "Always specify the jurisdiction: \"Under California law...\" or \"Per EU GDPR requirements...\"",
      "Upload contracts as PDFs and ask: \"Flag any unusual clauses or missing protections\"",
      "Use it for research, not advice \u2014 it will always remind you to consult a licensed attorney",
    ],
    example: "Review this vendor agreement and flag any one-sided terms, missing IP protections, or liability concerns.",
  },
  analyst: {
    tips: [
      "Give it numbers first \u2014 the Analyst works best with specific data points",
      "Ask for structured scenarios: \"Build a bull/base/bear case for this acquisition\"",
      "Use it for quick market sizing: \"What's the TAM/SAM/SOM for [industry] in [region]?\"",
    ],
    example: "I'm raising a Series A at $15M pre. Our ARR is $1.2M growing 15% MoM. Help me build the financial model.",
  },
  researcher: {
    tips: [
      "Be specific about scope: \"Research the last 3 years of studies on [topic]\"",
      "Ask it to evaluate source quality: \"How credible is this? What's the methodology?\"",
      "Request structured outputs: \"Give me background, methodology, findings, analysis, and limitations\"",
    ],
    example: "Search for recent studies on employee retention in remote-first companies. Synthesize the findings.",
  },
  operator: {
    tips: [
      "Start with the outcome: \"I need to launch [X] by [date]. Break it down for me.\"",
      "Use it as a daily standup partner: \"Here's what I did today, what should I focus on tomorrow?\"",
      "Have it prioritize: \"I have 12 tasks. Help me rank them P0/P1/P2.\"",
    ],
    example: "I'm shipping a product update next Friday. Here's what's left: [list]. Help me prioritize and create a day-by-day plan.",
  },
  writer: {
    tips: [
      "Always state the audience: \"This is for our investors\" vs. \"This is for our engineering team\"",
      "Ask for drafts first, then iterate: \"Draft v1, then I'll give you feedback\"",
      "Specify tone: \"Write this like a CEO update \u2014 confident but not arrogant\"",
    ],
    example: "Draft a cold email to a potential enterprise customer. We sell compliance automation for fintech. Keep it under 150 words.",
  },
  director: {
    tips: [
      "Start with the platform and length: \"30-second TikTok\" vs. \"3-minute YouTube tutorial\" — Director optimizes for each",
      "Describe your product/demo: \"It's an encrypted AI chat app\" — Director builds the visual story around it",
      "Ask for complete packages: \"Give me the script, shot list, and voiceover\" — one prompt, everything you need",
    ],
    example: "Script a 60-second product demo video for HammerLock AI. Show the vault feature, agent switching, and privacy pitch. Punchy and modern.",
  },
};

/** Vault settings key for tracking which agents have been introduced */
const AGENT_INTRO_SEEN_KEY = "agent_intro_seen";

/** ─── WORKFLOW ENGINE ───
 * Agent-aware action buttons + smart multi-step workflow chains.
 * Each agent gets contextual actions based on what it just generated,
 * plus proactive multi-step workflow suggestions.
 */

type WorkflowAction = {
  id: string;
  icon: string;
  label: string;
  /** Command template — {content} is replaced with the AI response */
  command: string;
};

type WorkflowChain = {
  id: string;
  icon: string;
  label: string;
  /** Steps described for the user */
  description: string;
  /** Array of commands to execute sequentially */
  steps: string[];
  /** Keywords that trigger this chain suggestion (matched against AI response) */
  triggers: string[];
};

/** Per-agent quick actions shown as buttons on AI responses */
const AGENT_ACTIONS: Record<string, WorkflowAction[]> = {
  analyst: [
    { id: "email_report", icon: "📧", label: "Email This", command: "Send email with subject 'Financial Analysis from HammerLock AI': {content}" },
    { id: "save_notes", icon: "📝", label: "Save to Notes", command: "Create note in Apple Notes: Financial Analysis\n\n{content}" },
    { id: "add_tasks", icon: "✅", label: "Create Tasks", command: "Add to my todo list: Review and validate the financial model assumptions, Update revenue forecast spreadsheet, Schedule review meeting" },
  ],
  strategist: [
    { id: "email_report", icon: "📧", label: "Email This", command: "Send email with subject 'Strategy Brief from HammerLock AI': {content}" },
    { id: "save_notes", icon: "📝", label: "Save to Notes", command: "Create note in Apple Notes: Strategy Brief\n\n{content}" },
    { id: "add_tasks", icon: "✅", label: "Action Items", command: "Add to my todo list: Execute on strategy recommendations, Research competitor moves, Schedule strategy review" },
  ],
  counsel: [
    { id: "email_report", icon: "📧", label: "Email Analysis", command: "Send email with subject 'Legal Analysis from HammerLock AI': {content}" },
    { id: "save_notes", icon: "📝", label: "Save to Notes", command: "Create note in Apple Notes: Legal Analysis\n\n{content}" },
    { id: "calendar_review", icon: "📅", label: "Schedule Review", command: "Schedule a meeting to review legal analysis findings" },
  ],
  researcher: [
    { id: "email_report", icon: "📧", label: "Email Research", command: "Send email with subject 'Research Brief from HammerLock AI': {content}" },
    { id: "save_notes", icon: "📝", label: "Save to Notes", command: "Create note in Apple Notes: Research Brief\n\n{content}" },
    { id: "add_tasks", icon: "✅", label: "Follow-ups", command: "Add to my todo list: Validate research sources, Deep-dive into key findings, Compile final research report" },
  ],
  operator: [
    { id: "add_tasks", icon: "✅", label: "Create Tasks", command: "Add to my todo list: {content}" },
    { id: "calendar", icon: "📅", label: "Schedule It", command: "Add to calendar: {content}" },
    { id: "email_team", icon: "📧", label: "Email Team", command: "Send email with subject 'Action Plan from HammerLock AI': {content}" },
  ],
  writer: [
    { id: "email_draft", icon: "📧", label: "Send as Email", command: "Send email: {content}" },
    { id: "save_notes", icon: "📝", label: "Save Draft", command: "Create note in Apple Notes: Draft\n\n{content}" },
    { id: "copy_clean", icon: "📋", label: "Copy Clean", command: "__copy_clean__" },
  ],
  coach: [
    { id: "save_plan", icon: "📝", label: "Save Plan", command: "Create note in Apple Notes: Fitness & Wellness Plan\n\n{content}" },
    { id: "set_reminder", icon: "⏰", label: "Set Reminder", command: "Set a reminder: Time for your workout! Here's the plan: {content}" },
    { id: "grocery_list", icon: "🛒", label: "Grocery List", command: "Create note in Apple Notes: Grocery List\n\n{content}" },
  ],
  money: [
    { id: "save_budget", icon: "📝", label: "Save Budget", command: "Create note in Apple Notes: Budget Plan\n\n{content}" },
    { id: "set_reminder", icon: "⏰", label: "Bill Reminder", command: "Set a reminder: Budget check-in — {content}" },
    { id: "email_it", icon: "📧", label: "Email Summary", command: "Send email with subject 'Budget Summary from HammerLock AI': {content}" },
  ],
  content: [
    { id: "copy_post", icon: "📋", label: "Copy Post", command: "__copy_clean__" },
    { id: "save_calendar", icon: "📝", label: "Save Calendar", command: "Create note in Apple Notes: Content Calendar\n\n{content}" },
    { id: "schedule_post", icon: "⏰", label: "Schedule Post", command: "Set a reminder: Time to post! Content ready: {content}" },
  ],
  director: [
    { id: "copy_script", icon: "📋", label: "Copy Script", command: "__copy_clean__" },
    { id: "save_script", icon: "📝", label: "Save Script", command: "Create note in Apple Notes: Video Script\n\n{content}" },
    { id: "email_script", icon: "📧", label: "Email Script", command: "Send email with subject 'Video Script from HammerLock AI': {content}" },
  ],
  general: [
    { id: "email_it", icon: "📧", label: "Email This", command: "Send email with subject 'From HammerLock AI': {content}" },
    { id: "save_notes", icon: "📝", label: "Save to Notes", command: "Create note in Apple Notes: {content}" },
    { id: "remind_me", icon: "⏰", label: "Remind Me", command: "Set a reminder: Follow up on this — {content}" },
  ],
};

/** Smart workflow chains — multi-step sequences suggested based on context */
const WORKFLOW_CHAINS: Record<string, WorkflowChain[]> = {
  analyst: [
    {
      id: "full_report_flow",
      icon: "🔄",
      label: "Full Report Pipeline",
      description: "Save analysis → Create review tasks → Email to stakeholders",
      steps: [
        "Create note in Apple Notes: Financial Analysis Report\n\n{content}",
        "Add to my todo list: Review financial model assumptions, Validate conversion rate estimates, Update P&L spreadsheet with new projections",
        "Send email with subject 'Financial Analysis Ready for Review': I've completed a financial analysis. Key findings are saved in Notes. Please review when you have a chance.",
      ],
      triggers: ["revenue", "forecast", "model", "scenario", "bull", "bear", "base case", "projection", "financial"],
    },
    {
      id: "investor_prep",
      icon: "💰",
      label: "Investor Prep Pipeline",
      description: "Save model → Draft investor email → Schedule pitch prep",
      steps: [
        "Create note in Apple Notes: Investor-Ready Financial Model\n\n{content}",
        "Add to my todo list: Polish financial model for investors, Prepare Q&A for tough questions, Update pitch deck with new numbers",
        "Schedule a meeting for pitch deck review and investor prep session",
      ],
      triggers: ["series", "fundrais", "investor", "valuation", "pitch", "raise", "round"],
    },
  ],
  strategist: [
    {
      id: "strategy_exec",
      icon: "🔄",
      label: "Strategy → Execution",
      description: "Save strategy → Create action items → Email team → Schedule kickoff",
      steps: [
        "Create note in Apple Notes: Strategy Document\n\n{content}",
        "Add to my todo list: Execute top 3 strategic priorities, Assign ownership for each initiative, Set 30/60/90 day milestones",
        "Schedule a meeting for strategy kickoff and team alignment",
      ],
      triggers: ["strategy", "competitive", "swot", "market entry", "go-to-market", "positioning", "roadmap"],
    },
  ],
  counsel: [
    {
      id: "legal_review_flow",
      icon: "🔄",
      label: "Legal Review Pipeline",
      description: "Save findings → Flag action items → Schedule attorney review",
      steps: [
        "Create note in Apple Notes: Legal Review Findings\n\n{content}",
        "Add to my todo list: Address flagged contract issues, Consult with licensed attorney on key concerns, Prepare revised contract draft",
        "Schedule a meeting for legal review with outside counsel",
      ],
      triggers: ["contract", "clause", "liability", "indemnif", "warrant", "breach", "compliance", "risk", "legal"],
    },
  ],
  researcher: [
    {
      id: "research_to_action",
      icon: "🔄",
      label: "Research → Report → Share",
      description: "Save research → Compile report → Email findings",
      steps: [
        "Create note in Apple Notes: Research Findings\n\n{content}",
        "Add to my todo list: Validate key research sources, Identify gaps for follow-up research, Draft executive summary of findings",
        "Send email with subject 'Research Findings Summary': Research is complete. Key findings have been saved to Notes. Summary attached.",
      ],
      triggers: ["study", "research", "finding", "evidence", "literature", "source", "methodology", "paper"],
    },
  ],
  operator: [
    {
      id: "plan_to_calendar",
      icon: "🔄",
      label: "Plan → Tasks → Calendar",
      description: "Create all tasks → Block calendar time → Email team the plan",
      steps: [
        "Add to my todo list: {content}",
        "Schedule a meeting for weekly sprint review and progress check",
        "Send email with subject 'This Week\\'s Plan': Here\\'s the execution plan for this week. Tasks have been created and calendar time blocked.",
      ],
      triggers: ["plan", "sprint", "priorit", "p0", "p1", "task", "deadline", "milestone", "checklist", "standup"],
    },
  ],
  writer: [
    {
      id: "publish_flow",
      icon: "🔄",
      label: "Draft → Review → Send",
      description: "Save draft → Create review task → Send when ready",
      steps: [
        "Create note in Apple Notes: Content Draft\n\n{content}",
        "Add to my todo list: Proofread and polish the draft, Get feedback from team, Schedule publication date",
      ],
      triggers: ["draft", "blog", "post", "article", "email", "copy", "pitch", "newsletter", "script"],
    },
  ],
  coach: [
    {
      id: "fitness_routine",
      icon: "💪",
      label: "Save Plan → Set Reminders",
      description: "Save workout plan → Create grocery list → Set daily reminder",
      steps: [
        "Create note in Apple Notes: Workout & Meal Plan\n\n{content}",
        "Set a reminder for tomorrow at 7am: Time for your workout! Check your plan in Notes.",
      ],
      triggers: ["workout", "exercise", "meal plan", "calories", "protein", "sets", "reps", "cardio", "strength", "routine"],
    },
  ],
  money: [
    {
      id: "budget_pipeline",
      icon: "💰",
      label: "Save Budget → Set Bill Reminders",
      description: "Save budget to Notes → Set reminder for monthly check-in",
      steps: [
        "Create note in Apple Notes: Monthly Budget Plan\n\n{content}",
        "Set a reminder: Monthly budget review — check spending against plan and adjust for next month",
      ],
      triggers: ["budget", "expense", "income", "debt", "saving", "payoff", "interest", "monthly", "credit card", "loan"],
    },
  ],
  content: [
    {
      id: "content_pipeline",
      icon: "📱",
      label: "Save Calendar → Schedule Posts",
      description: "Save content calendar → Set posting reminders",
      steps: [
        "Create note in Apple Notes: Content Calendar\n\n{content}",
        "Set a reminder: Content posting day! Check your calendar in Notes for today's post.",
      ],
      triggers: ["post", "caption", "content", "instagram", "tiktok", "linkedin", "twitter", "hook", "carousel", "reel", "thread"],
    },
  ],
  director: [
    {
      id: "script_to_production",
      icon: "🎬",
      label: "Script → Save → Schedule Shoot",
      description: "Save video script → Create shot list tasks → Schedule shoot day",
      steps: [
        "Create note in Apple Notes: Video Script\n\n{content}",
        "Add to my todo list: Review and finalize script, Prep set and props, Record B-roll footage, Film main takes, Edit and add music",
        "Set a reminder: Video shoot day! Script is saved in Notes — review it before you start.",
      ],
      triggers: ["script", "scene", "shot", "take", "voiceover", "b-roll", "hook", "cta", "demo", "tutorial", "walkthrough"],
    },
    {
      id: "video_series_plan",
      icon: "📺",
      label: "Plan Series → Save → Remind",
      description: "Save video series plan → Set weekly filming reminders",
      steps: [
        "Create note in Apple Notes: Video Series Plan\n\n{content}",
        "Set a reminder: Video content day! Check your series plan in Notes and film the next episode.",
      ],
      triggers: ["series", "episode", "weekly", "campaign", "launch", "funnel", "playlist"],
    },
  ],
};

/** Detect which workflow chains are relevant based on AI response content */
function detectRelevantChains(agentId: string, responseText: string): WorkflowChain[] {
  const chains = WORKFLOW_CHAINS[agentId] || [];
  const lower = responseText.toLowerCase();
  return chains.filter(chain =>
    chain.triggers.some(trigger => lower.includes(trigger))
  );
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
  const { pvIsUnlocked, pvHasVault } = usePersonalVault();
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
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);
  const [optionsOpen, setOptionsOpen] = useState(false);
  // ---- @mention agent picker state ----
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  // ---- Agent state ----
  const [activeAgentId, setActiveAgentId] = useState<string>(DEFAULT_AGENT_ID);
  const [customAgents, setCustomAgents] = useState<AgentDef[]>([]);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [newAgent, setNewAgent] = useState<CustomAgentInput>({
    name: "", tagline: "", icon: "Bot", color: "#00ff88",
    expertise: "", personality: "", instructions: "",
  });

  // ---- File Vault state ----
  const [showVaultPanel, setShowVaultPanel] = useState(false);
  const [showPersonalVaultPanel, setShowPersonalVaultPanel] = useState(false);
  const [vaultSearchQuery, setVaultSearchQuery] = useState("");
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeys, setApiKeys] = useState({ openai: "", anthropic: "", gemini: "", groq: "", mistral: "", deepseek: "", brave: "" });
  const [onboardingStep, setOnboardingStep] = useState(-1);
  // ---- UI enhancements ----
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chainRunning, setChainRunning] = useState(false);
  const [chainStep, setChainStep] = useState(0);
  const [chainTotal, setChainTotal] = useState(0);
  const [workflowToast, setWorkflowToast] = useState<string | null>(null);
  const [activeNudge, setActiveNudge] = useState<NudgeDef | null>(null);
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { shouldShow: shouldShowNudge, dismissNudge, disableAll: disableAllNudges } = useNudges();
  const [tutorialStep, setTutorialStep] = useState(-1);
  const [onboardingAnswers, setOnboardingAnswers] = useState<Record<string, string>>({});
  const [onboardingInput, setOnboardingInput] = useState("");
  const [computeUnits, setComputeUnits] = useState<{ remaining: number; total: number; usingOwnKey: boolean } | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  /** True when the current message was triggered via voice input — auto-play TTS on reply */
  const voiceInputRef = useRef(false);
  /** True when in "talk to me" live conversation mode — auto-restart mic after TTS */
  const liveConvoRef = useRef(false);
  /** Stable ref to sendCommand for use in voice callbacks (avoids stale closure) */
  const sendCommandRef = useRef<(preset?: string) => void>(() => {});
  /** Stable ref to handleVoice for use in TTS callbacks */
  const handleVoiceRef = useRef<() => void>(() => {});
  /** Callback invoked when TTS audio finishes — used by "talk to me" to auto-restart mic */
  const ttsFinishedCallbackRef = useRef<(() => void) | null>(null);

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

  // ---- @mention filtered agents ----
  const allAgents = [...BUILT_IN_AGENTS, ...customAgents];
  const mentionAgents = showMentionMenu
    ? allAgents.filter(a =>
        a.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(mentionQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  // Auto-focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [messages]);

  // ---- REMINDER SCHEDULER: check persona reminders against system clock ----
  const firedRemindersRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    // Request notification permission on mount
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const personaText = vaultData?.persona || "";
      if (!personaText) return;

      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      // Parse reminder lines: "Reminder: drink water (daily at 10am)"
      const reminderLines = personaText.split("\n").filter((l: string) => /^Reminder:/i.test(l.trim()));
      for (const line of reminderLines) {
        const match = line.match(/^Reminder:\s*(.+?)\s*\(daily\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\)/i);
        if (!match) continue;
        const task = match[1].trim();
        let hour = parseInt(match[2], 10);
        const minute = match[3] ? parseInt(match[3], 10) : 0;
        const ampm = (match[4] || "").toLowerCase();
        if (ampm === "pm" && hour < 12) hour += 12;
        if (ampm === "am" && hour === 12) hour = 0;

        if (currentH === hour && currentM === minute) {
          const key = `${task}-${currentH}:${currentM}-${now.toDateString()}`;
          if (firedRemindersRef.current.has(key)) continue;
          firedRemindersRef.current.add(key);

          // Get user's name from persona
          const nameMatch = personaText.match(/^Name:\s*(.+)/im);
          const name = nameMatch ? nameMatch[1].trim() : "";
          const greeting = name ? `Hey ${name}, ` : "Hey, ";
          const alertText = `${greeting}${task}!`;

          // 1. In-app message
          const rid = `reminder-${Date.now()}`;
          setMessages(prev => [...prev, {
            id: rid, role: "ai" as const, content: `🔔 **Reminder:** ${alertText}`,
            timestamp: now.toISOString(), pending: false,
          }]);

          // 2. Browser notification
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("HammerLock AI Reminder", { body: alertText, icon: "/icon-512.png" });
          }

          // 3. TTS if available
          try {
            fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: alertText, voice: "nova" }),
            }).then(res => {
              if (res.ok && res.headers.get("content-type")?.includes("audio")) {
                res.blob().then(blob => {
                  const url = URL.createObjectURL(blob);
                  const audio = new Audio(url);
                  audio.onended = () => URL.revokeObjectURL(url);
                  audio.play();
                });
              }
            }).catch(() => {
              // Fallback to browser TTS
              if (typeof window !== "undefined" && window.speechSynthesis) {
                const utter = new SpeechSynthesisUtterance(alertText);
                window.speechSynthesis.speak(utter);
              }
            });
          } catch { /* silent */ }
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [vaultData?.persona]);

  // ---- SCHEDULED AGENT TASKS: check /api/schedules and execute due tasks ----
  const scheduleFiredRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!isUnlocked) return;

    const checkSchedules = async () => {
      try {
        const res = await fetch("/api/schedules");
        if (!res.ok) return;
        const { due } = await res.json() as { due: ScheduledTask[] };

        for (const task of due) {
          // Skip if already fired this cycle
          const fireKey = `${task.id}-${new Date().toISOString().slice(0, 16)}`;
          if (scheduleFiredRef.current.has(fireKey)) continue;
          scheduleFiredRef.current.add(fireKey);

          // Mark as fired on the server
          await fetch("/api/schedules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId: task.id }),
          });

          // Get agent definition for system prompt
          const agent = getAgentById(task.agentId);
          const agentName = agent?.name || task.agentId;
          const agentSystemPrompt = agent?.systemPrompt || "";

          // Add a "running" message to chat
          const schedMsgId = `sched-${Date.now()}-${task.id}`;
          setMessages(prev => [...prev, {
            id: schedMsgId,
            role: "ai" as const,
            content: `⏰ **Scheduled Task Running** — ${agentName} agent\n\n_${task.task}_\n\n⏳ Working on it...`,
            timestamp: new Date().toISOString(),
            pending: true,
          }]);

          // Execute the agent prompt via /api/execute
          try {
            const execRes = await fetch("/api/execute", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                command: task.prompt,
                agentSystemPrompt,
                locale: "en",
                history: [],
              }),
            });
            const data = await execRes.json();
            const response = data.response || data.error || "Task completed but returned no output.";

            // Update the message with the result
            setMessages(prev => prev.map(m =>
              m.id === schedMsgId ? {
                ...m,
                content: `⏰ **Scheduled Task Complete** — ${agentName} agent\n📋 _${task.task}_\n\n---\n\n${response}`,
                pending: false,
              } : m
            ));

            // Browser notification
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification(`HammerLock AI — ${agentName}`, {
                body: `Scheduled task complete: ${task.task}`,
                icon: "/icon-512.png",
              });
            }

            // TTS notification
            try {
              const ttsText = `Your scheduled ${agentName} task is complete: ${task.task}`;
              fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: ttsText, voice: "nova" }),
              }).then(r => {
                if (r.ok && r.headers.get("content-type")?.includes("audio")) {
                  r.blob().then(blob => {
                    const url = URL.createObjectURL(blob);
                    const audio = new Audio(url);
                    audio.onended = () => URL.revokeObjectURL(url);
                    audio.play();
                  });
                }
              }).catch(() => {
                if (typeof window !== "undefined" && window.speechSynthesis) {
                  const utter = new SpeechSynthesisUtterance(`Scheduled task complete: ${task.task}`);
                  window.speechSynthesis.speak(utter);
                }
              });
            } catch { /* silent */ }

          } catch (err) {
            // Execution failed — update message with error
            setMessages(prev => prev.map(m =>
              m.id === schedMsgId ? {
                ...m,
                content: `⏰ **Scheduled Task Failed** — ${agentName} agent\n📋 _${task.task}_\n\n❌ ${(err as Error).message || "Unknown error"}`,
                pending: false,
              } : m
            ));
          }
        }
      } catch { /* silent — API might not be ready */ }
    };

    // Check immediately on mount, then every 30 seconds
    checkSchedules();
    const scheduleInterval = setInterval(checkSchedules, 30000);
    return () => clearInterval(scheduleInterval);
  }, [isUnlocked]);

  // Listen for Electron menu bar events (refs for stable callbacks)
  const createNewConversationRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    const onNewChat = () => createNewConversationRef.current?.();
    const onToggleSidebar = () => setSidebarOpen(prev => !prev);
    const onOpenSettings = () => setShowApiKeyModal(true);
    window.addEventListener("hammerlock:new-chat", onNewChat);
    window.addEventListener("hammerlock:toggle-sidebar", onToggleSidebar);
    window.addEventListener("hammerlock:open-settings", onOpenSettings);
    return () => {
      window.removeEventListener("hammerlock:new-chat", onNewChat);
      window.removeEventListener("hammerlock:toggle-sidebar", onToggleSidebar);
      window.removeEventListener("hammerlock:open-settings", onOpenSettings);
    };
  }, []);

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
        name: `${t.chat_default_name} 1`,
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
        name: `${t.chat_default_name} 1`,
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
    if (!vaultData?.persona
        && (!vaultData?.chatHistory || vaultData.chatHistory.length === 0)
        && !vaultData?.settings?.onboarding_completed) {
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
        `Uses HammerLock AI for: ${newAnswers.use_case || ""}`,
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

      // Don't add a welcome message — let the empty state greet the user
      // with prompt suggestions (like ChatGPT / Claude). The empty-state
      // will show "Welcome back, <name>" with suggestion cards.
      setMessages([]);

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

  // ---- AUTO-LOCK ON INACTIVITY (5 minutes) ----
  const AUTO_LOCK_MS = 5 * 60 * 1000;
  const autoLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAutoLock = useCallback(() => {
    if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
    if (!isUnlocked) return;
    autoLockTimerRef.current = setTimeout(() => {
      handleLock();
    }, AUTO_LOCK_MS);
  }, [isUnlocked, handleLock]);

  useEffect(() => {
    if (!isUnlocked) return;
    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    const handler = () => resetAutoLock();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetAutoLock(); // start timer on mount
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
    };
  }, [isUnlocked, resetAutoLock]);

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
    // Save current conversation, then create new one
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === activeConvoId ? { ...c, messages, updatedAt: new Date().toISOString() } : c
      );
      const newConvo: Conversation = {
        id: generateId(),
        name: `${t.chat_default_name} ${updated.length + 1}`,
        groupId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setActiveConvoId(newConvo.id);
      return [...updated, newConvo];
    });
    // Reset state OUTSIDE the setConversations callback to ensure it fires
    setMessages([]);
    setActiveAgentId(DEFAULT_AGENT_ID);
    setUploadedPdf(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [activeConvoId, messages]);

  // Keep ref in sync for Electron menu events
  createNewConversationRef.current = createNewConversation;

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

  // ---- AUTO-TITLE GENERATOR (non-blocking) ----
  const generateConvoTitle = useCallback(async (userMsg: string, aiReply: string, convoId: string) => {
    try {
      // Read current conversations for dedup (use functional update to avoid stale closure)
      let existingNames: string[] = [];
      setConversations(cs => { existingNames = cs.map(c => c.name).filter(n => !n.startsWith(t.chat_default_name)); return cs; });
      const avoidList = existingNames.length > 0 ? `\nExisting titles (DO NOT reuse these): ${existingNames.slice(0, 10).join(", ")}` : "";
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: `Title this chat in 2-5 words. Be SPECIFIC to the content. No quotes, no period, no emoji.\nBAD (too generic): "Casual Greeting Exchange", "General Conversation", "Chat Session", "Friendly Chat"\nGOOD (specific): "Sushi Near San Ramon", "Weekly Weather Check", "Pizza Recommendations", "Kid Summer Camp Ideas"${avoidList}\n\nChat:\nUser: ${userMsg.slice(0, 200)}\nAI: ${aiReply.slice(0, 200)}\n\nTitle:`,
          locale,
        }),
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json();
      let title = (data.response || data.reply || "").replace(/^["']|["']$/g, "").replace(/\.+$/, "").trim();
      if (title && title.length > 2 && title.length < 60) {
        // Dedup: if this title already exists, append a number
        if (existingNames.includes(title)) {
          let n = 2;
          while (existingNames.includes(`${title} ${n}`)) n++;
          title = `${title} ${n}`;
        }
        setConversations(cs => cs.map(c => c.id === convoId ? { ...c, name: title } : c));
      }
    } catch { /* non-critical, keep truncated user message */ }
  }, [locale, t.chat_default_name]);

  // ---- SEND MESSAGE ----
  const sendCommand = useCallback(async (preset?: string) => {
    const text = (preset || input).trim();
    if (text === "" || sending) return;
    if (!canSendMessage) { setPaywallFeature("messages"); setShowPaywall(true); return; }

    let fullText = text;
    const currentPdf = uploadedPdf;
    if (currentPdf) {
      const isImage = currentPdf.text.includes("data:image/");
      // Don't truncate images — the full base64 data URL is needed for vision
      const pdfSnippet = isImage ? currentPdf.text
        : (currentPdf.text.length > 8000
          ? currentPdf.text.slice(0, 8000) + t.chat_pdf_truncated
          : currentPdf.text);
      fullText = `${t.chat_pdf_attached(currentPdf.name)}\n\n${pdfSnippet}\n\n---\n\nUser question: ${text}`;
      setUploadedPdf(null);
    }

    const ts = new Date().toISOString();
    const uid = Date.now().toString();
    const pid = String(Date.now()+1);
    const userMsg: VaultMessage = {id:uid,role:"user",content:text + (currentPdf ? t.chat_pdf_ref(currentPdf.name) : ""),timestamp:ts};
    const pendingMsg: VaultMessage = {id:pid,role:"ai",content:getThinkingMessage(),timestamp:ts,pending:true};
    setMessages(prev => [...prev, userMsg, pendingMsg]);
    setInput(""); setSending(true);
    setTimeout(() => inputRef.current?.focus(), 0);

    try {
      const currentAgent = getAgentById(activeAgentId, customAgents);
      // Send conversation history for context (last 20 messages, excluding pending)
      const recentHistory = messages
        .filter(m => !m.pending && (m.role === "user" || m.role === "ai"))
        .slice(-20)
        .map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
      // Build user profile from vault persona data so the LLM knows who the user is
      const personaText = vaultData?.persona || "";
      const personaParts: Record<string, string> = {};
      personaText.split("\n").filter((l: string) => l.trim()).forEach((line: string) => {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0 && colonIdx < 30) {
          const key = line.slice(0, colonIdx).trim().toLowerCase();
          const val = line.slice(colonIdx + 1).trim();
          if (key === "name") personaParts.name = val;
          else if (key === "role" || key === "job" || key === "occupation") personaParts.role = val;
          else if (key === "industry" || key === "field") personaParts.industry = val;
          else personaParts.context = (personaParts.context ? personaParts.context + "; " : "") + line.trim();
        }
      });
      const userProfile = Object.keys(personaParts).length > 0 ? personaParts : undefined;
      const res = await fetch("/api/execute", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({command:fullText,persona:"operator",userProfile,agentSystemPrompt:currentAgent?.systemPrompt,locale,history:recentHistory})});
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

      // Handle language switch directive from server
      if (data.switchLocale) {
        setLocale(data.switchLocale as Locale);
      }

      // Handle nudge toggle directive from server
      if (data.setNudges !== undefined) {
        updateVaultData((prev) => ({
          ...prev,
          settings: { ...prev.settings, nudges_enabled: data.setNudges },
        }));
      }

      const reply = data.reply || data.response || data.result || t.chat_no_response;
      const msgSources = Array.isArray(data.sources) ? data.sources : undefined;
      const msgSourcesSummary = data.sourcesSummary || undefined;
      const msgFollowUps = Array.isArray(data.followUps) ? data.followUps : undefined;
      const msgActionType = typeof data.actionType === "string" ? data.actionType : undefined;
      const msgActionStatus = (data.actionStatus === "success" || data.actionStatus === "error")
        ? data.actionStatus as "success" | "error" : undefined;
      setMessages(prev => {
        const updated = prev.map(m => m.id===pid ? {...m,content:reply,pending:false,timestamp:new Date().toISOString(),sources:msgSources,sourcesSummary:msgSourcesSummary,followUps:msgFollowUps,actionType:msgActionType,actionStatus:msgActionStatus} : m);
        // Auto-name conversation from first user message (like Claude/ChatGPT)
        const isFirstExchange = prev.filter(m => m.role === "user").length <= 1;
        setConversations(cs => cs.map(c => {
          if (c.id !== activeConvoId) return c;
          if (isFirstExchange && c.name.startsWith(t.chat_default_name)) {
            const tempName = text.replace(/\n/g, " ").trim().slice(0, 45) + (text.length > 45 ? "…" : "");
            generateConvoTitle(text, reply, c.id);
            return { ...c, name: tempName, messages: updated, updatedAt: new Date().toISOString() };
          }
          return { ...c, messages: updated, updatedAt: new Date().toISOString() };
        }));
        return updated;
      });
      incrementMessageCount();

      // Contextual nudges — show tips at the right moment
      // Suppress for short utility queries (time, date, status) — don't interrupt quick checks
      const isQuickUtility = /^(wh?at\s*(?:time|tim)|w(?:hat)?t\s*(?:rn)?|time\s*(?:rn|now)?|(?:the\s+)?date|status)[\s?!.]*$/i.test(text.trim());
      if (!isQuickUtility) {
        const msgCount = messageCount + 1;
        if (msgCount === 2) triggerNudge("remember_tip");
        else if (msgCount === 5) triggerNudge("agents_tip");
        else if (msgCount === 8) triggerNudge("search_tip");
        else if (msgCount === 10) triggerNudge("voice_tip");
        else if (msgCount === 15) triggerNudge("agent_deep_tip");
        else if (msgCount === 20) triggerNudge("vault_tip");
      }

      // Auto-play TTS if user said "read this out loud", "talk to me", or if input came from voice
      const ttsExact = /^(talk\s+to\s+me|read\s+it\s+(?:out\s+)?(?:loud|aloud)|say\s+it)[\s.!?]*$/i;
      const ttsPrefix = /^(read\s+(?:this\s+)?out\s+loud|say\s+this|speak|read\s+aloud|talk\s+to\s+me)[:\s]/i;
      const isTalkToMe = /^talk\s+to\s+me[\s.!?]*$/i.test(text.trim());
      const shouldAutoTTS = voiceInputRef.current || ttsExact.test(text.trim()) || ttsPrefix.test(text.trim());

      // "talk to me" = live conversation mode
      if (isTalkToMe) liveConvoRef.current = true;

      if (shouldAutoTTS) {
        voiceInputRef.current = false;
        // In live convo mode, set a callback that fires when TTS audio actually ends
        // (replaces the old brittle word-count * 350ms estimate)
        if (liveConvoRef.current) {
          ttsFinishedCallbackRef.current = () => {
            if (liveConvoRef.current && !isListening) {
              setTimeout(() => handleVoiceRef.current(), 300); // small buffer before re-listening
            }
          };
        }
        setTimeout(() => handleReadAloud(pid, reply), 300);
      }

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

  // Keep sendCommand ref in sync so voice callbacks always use latest version
  sendCommandRef.current = sendCommand;

  // ---- VOICE INPUT with silence detection ----
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceFrameRef = useRef(0);

  const handleVoice = useCallback(async () => {
    if (!isFeatureAvailable("voice_input")) {
      setPaywallFeature("Voice Input"); setShowPaywall(true); return;
    }
    if (isListening && mediaRecorderRef.current) {
      // Toggle off — stop recording
      if (silenceTimerRef.current) { clearInterval(silenceTimerRef.current as unknown as number); silenceTimerRef.current = null; }
      if (audioContextRef.current) { audioContextRef.current.close().catch(() => {}); audioContextRef.current = null; }
      mediaRecorderRef.current.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      // Set up silence detection with Web Audio API
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;
      silenceFrameRef.current = 0;
      let hasSpeech = false;

      // Check audio levels every 100ms
      const SILENCE_THRESHOLD = 15; // RMS level below which = silence
      const SILENCE_FRAMES_TO_STOP = 20; // 20 * 100ms = 2 seconds of silence
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      silenceTimerRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const rms = Math.sqrt(dataArray.reduce((sum, v) => sum + v * v, 0) / dataArray.length);

        if (rms > SILENCE_THRESHOLD) {
          hasSpeech = true;
          silenceFrameRef.current = 0;
        } else {
          silenceFrameRef.current++;
        }

        // Auto-stop after 2s of silence (only if user has spoken)
        if (hasSpeech && silenceFrameRef.current >= SILENCE_FRAMES_TO_STOP) {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
          }
          if (silenceTimerRef.current) { clearInterval(silenceTimerRef.current as unknown as number); silenceTimerRef.current = null; }
          if (audioContextRef.current) { audioContextRef.current.close().catch(() => {}); audioContextRef.current = null; }
        }
      }, 100) as unknown as ReturnType<typeof setTimeout>;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      const recordingStartTime = Date.now();

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (silenceTimerRef.current) { clearInterval(silenceTimerRef.current as unknown as number); silenceTimerRef.current = null; }
        if (audioContextRef.current) { audioContextRef.current.close().catch(() => {}); audioContextRef.current = null; }
        setIsListening(false);
        mediaRecorderRef.current = null;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        const recordingDuration = Date.now() - recordingStartTime;
        // Lower threshold: 0.5s minimum (was 1s)
        if (audioBlob.size < 1000 || recordingDuration < 500) {
          showError("Keep talking — I'm listening! Tap the mic and speak for at least a second.");
          return;
        }
        setInput(t.chat_transcribing);
        try {
          const formData = new FormData();
          const ext = mimeType.includes("mp4") ? "mp4" : "webm";
          formData.append("audio", audioBlob, `recording.${ext}`);
          formData.append("locale", locale);
          const res = await fetch("/api/transcribe", { method: "POST", body: formData });
          const data = await res.json();
          if (res.ok && data.text) {
            // Auto-send voice input and flag for auto-TTS reply
            voiceInputRef.current = true;
            setInput("");
            sendCommandRef.current(data.text);
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
        if (silenceTimerRef.current) { clearInterval(silenceTimerRef.current as unknown as number); silenceTimerRef.current = null; }
        if (audioContextRef.current) { audioContextRef.current.close().catch(() => {}); audioContextRef.current = null; }
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

  // Keep handleVoice ref in sync
  handleVoiceRef.current = handleVoice;

  // ---- COPY TO CLIPBOARD ----
  // ---- WORKFLOW ENGINE HANDLERS ----
  /** Execute a single workflow action (sends command through OpenClaw) */
  const handleWorkflowAction = useCallback((action: WorkflowAction, msgContent: string) => {
    if (action.command === "__copy_clean__") {
      // Special: strip markdown and copy clean text
      const clean = msgContent.replace(/[#*_`~\[\]()>]/g, "").replace(/\n{3,}/g, "\n\n").trim();
      navigator.clipboard.writeText(clean).then(() => {
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2000);
      }).catch(() => {});
      return;
    }
    const truncated = msgContent.length > 2000 ? msgContent.slice(0, 2000) + "..." : msgContent;
    const cmd = action.command.replace(/\{content\}/g, truncated);
    sendCommand(cmd);
  }, [sendCommand]);

  /** Execute a multi-step workflow chain sequentially */
  const handleWorkflowChain = useCallback(async (chain: WorkflowChain, msgContent: string) => {
    if (chainRunning) return;
    setChainRunning(true);
    setChainTotal(chain.steps.length);
    const truncated = msgContent.length > 2000 ? msgContent.slice(0, 2000) + "..." : msgContent;

    for (let i = 0; i < chain.steps.length; i++) {
      setChainStep(i + 1);
      setWorkflowToast(`🔨 Hammering step ${i + 1}/${chain.steps.length}...`);
      const cmd = chain.steps[i].replace(/\{content\}/g, truncated);
      sendCommand(cmd);
      // Wait between steps to let each action complete
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    setWorkflowToast("🔨 Nailed it! Workflow complete.");
    setTimeout(() => {
      setWorkflowToast(null);
      setChainRunning(false);
      setChainStep(0);
      setChainTotal(0);
    }, 2500);
  }, [chainRunning, sendCommand]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2000);
      })
      .catch(() => {
        // Fallback for sandboxed Electron / non-secure contexts
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          setCopiedToast(true);
          setTimeout(() => setCopiedToast(false), 2000);
        } catch {
          showError("Couldn't copy to clipboard");
        }
      });
  }, [showError]);

  // ---- NUDGE SYSTEM ----
  const triggerNudge = useCallback((nudgeId: string) => {
    if (!shouldShowNudge(nudgeId)) return;
    const nudge = NUDGE_CATALOG[nudgeId];
    if (!nudge) return;
    // Don't stack nudges — dismiss any existing one first
    if (activeNudge) return;
    // Small delay so it doesn't feel intrusive
    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    nudgeTimerRef.current = setTimeout(() => setActiveNudge(nudge), 1200);
  }, [shouldShowNudge, activeNudge]);

  const handleNudgeDismiss = useCallback(() => {
    setActiveNudge(null);
  }, []);

  const handleNudgeDismissPermanent = useCallback(() => {
    if (activeNudge) {
      dismissNudge(activeNudge.id);
    }
    setActiveNudge(null);
  }, [activeNudge, dismissNudge]);

  const handleNudgeDisableAll = useCallback(() => {
    disableAllNudges();
    setActiveNudge(null);
  }, [disableAllNudges]);

  const handleNudgeCta = useCallback((command: string) => {
    // Special command: open the agents section in sidebar
    if (command === "__open_agents_tab__") {
      setSidebarOpen(true);
      setOptionsOpen(true);
      setActiveNudge(null);
      return;
    }
    // If command ends with space, put it in input box
    if (command.endsWith(" ")) {
      setInput(command);
      inputRef.current?.focus();
    } else {
      sendCommand(command);
    }
    setActiveNudge(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- SAVE TO VAULT ----
  const [vaultSaved, setVaultSaved] = useState(false);
  const handleSaveToVault = useCallback(async (text: string) => {
    try {
      const snippet = text.length > 500 ? text.slice(0, 500) + "..." : text;
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: `remember: ${snippet}`, locale }),
      });
      if (res.ok) {
        setVaultSaved(true);
        setTimeout(() => setVaultSaved(false), 2000);
      }
    } catch { /* silent */ }
  }, [locale]);

  // ---- FILE VAULT OPERATIONS ----
  const vaultFiles: VaultFile[] = (vaultData?.vaultFiles || []) as VaultFile[];

  const addVaultFile = useCallback(async (file: Omit<VaultFile, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newFile: VaultFile = {
      ...file,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await updateVaultData(prev => ({
      ...prev,
      vaultFiles: [...(prev.vaultFiles || []), newFile],
    }));
    return newFile;
  }, [updateVaultData]);

  const deleteVaultFile = useCallback(async (fileId: string) => {
    await updateVaultData(prev => ({
      ...prev,
      vaultFiles: (prev.vaultFiles || []).filter(f => f.id !== fileId),
    }));
  }, [updateVaultData]);

  const saveSnippetToVault = useCallback(async (text: string, title?: string) => {
    const name = title || text.replace(/\n/g, " ").trim().slice(0, 60) + (text.length > 60 ? "..." : "");
    await addVaultFile({
      name,
      type: "snippet",
      content: text,
      tags: ["chat-snippet"],
      size: new Blob([text]).size,
    });
    setVaultSaved(true);
    setTimeout(() => setVaultSaved(false), 2000);
  }, [addVaultFile]);

  const saveNoteToVault = useCallback(async () => {
    if (!newNoteContent.trim()) return;
    const name = newNoteTitle.trim() || newNoteContent.trim().slice(0, 60) + (newNoteContent.length > 60 ? "..." : "");
    await addVaultFile({
      name,
      type: "note",
      content: newNoteContent,
      tags: ["note"],
      size: new Blob([newNoteContent]).size,
    });
    setNewNoteTitle("");
    setNewNoteContent("");
    setShowNewNote(false);
  }, [addVaultFile, newNoteTitle, newNoteContent]);

  const savePdfToVault = useCallback(async (fileName: string, text: string, size?: number) => {
    await addVaultFile({
      name: fileName,
      type: "pdf",
      content: text,
      mimeType: "application/pdf",
      tags: ["pdf", "document"],
      size,
    });
  }, [addVaultFile]);

  const filteredVaultFiles = vaultSearchQuery.trim()
    ? vaultFiles.filter(f =>
        f.name.toLowerCase().includes(vaultSearchQuery.toLowerCase()) ||
        f.content.toLowerCase().includes(vaultSearchQuery.toLowerCase()) ||
        f.tags.some(tag => tag.toLowerCase().includes(vaultSearchQuery.toLowerCase()))
      )
    : vaultFiles;

  // ---- READ ALOUD (TTS) — OpenAI TTS with browser fallback ----
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const handleReadAloud = useCallback(async (msgId: string, text: string) => {
    // Toggle off if already speaking this message
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
      setSpeakingMsgId(null);
      return;
    }
    // Stop any current speech
    window.speechSynthesis.cancel();
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
    setSpeakingMsgId(msgId);

    try {
      // Try OpenAI TTS first (much better voice quality)
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "nova" }),
      });

      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("audio")) {
          // Got audio back — play it
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          ttsAudioRef.current = audio;
          audio.onended = () => {
            setSpeakingMsgId(null); URL.revokeObjectURL(url); ttsAudioRef.current = null;
            // "Talk to me" mode: auto-restart mic when TTS finishes
            ttsFinishedCallbackRef.current?.();
            ttsFinishedCallbackRef.current = null;
          };
          audio.onerror = () => {
            setSpeakingMsgId(null); URL.revokeObjectURL(url); ttsAudioRef.current = null;
            ttsFinishedCallbackRef.current?.();
            ttsFinishedCallbackRef.current = null;
          };
          audio.play();
          return;
        }
        // JSON response means fallback needed
      }
    } catch {
      // Network error — fall through to browser TTS
    }

    // Fallback: browser Web Speech API
    const cleanText = text.replace(/[#*_`~\[\]()]/g, "").replace(/!\[.*?\]\(.*?\)/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => {
      setSpeakingMsgId(null);
      ttsFinishedCallbackRef.current?.();
      ttsFinishedCallbackRef.current = null;
    };
    utterance.onerror = () => {
      setSpeakingMsgId(null);
      ttsFinishedCallbackRef.current?.();
      ttsFinishedCallbackRef.current = null;
    };
    window.speechSynthesis.speak(utterance);
  }, [speakingMsgId]);

  // ---- REGENERATE LAST RESPONSE ----
  const handleRegenerate = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMsg) {
      // Remove the last assistant message
      setMessages(prev => {
        const copy = [...prev];
        while (copy.length > 0 && copy[copy.length - 1].role === "ai") copy.pop();
        return copy;
      });
      // Re-send the last user message
      setTimeout(() => sendCommand(lastUserMsg.content), 100);
    }
  }, [messages, sendCommand]);

  // ---- TUTORIAL (first launch) ----
  const TUTORIAL_STEPS = [
    { icon: "🔐", title: t.tutorial_title || "Get the Most Out of HammerLock AI", desc: t.tutorial_step1_desc || "HammerLock AI encrypts everything on your device. Your conversations, personas, and files never leave your machine." },
    { icon: "🤖", title: t.tutorial_step2_title || "6 Specialized Agents", desc: t.tutorial_step2_desc || "Switch between Strategist, Counsel, Analyst, Researcher, Operator, and Writer in the sidebar. Create your own custom agents too." },
    { icon: "🎙️", title: t.tutorial_step3_title || "Voice & Web Search", desc: t.tutorial_step3_desc || "Click the microphone to dictate. Type 'search' to find anything on the web with cited sources. All queries are PII-scrubbed." },
    { icon: "🧠", title: t.tutorial_step4_title || "Teach It About You", desc: t.tutorial_step4_desc || "Say 'remember that...' to store preferences. Load your persona each session. HammerLock AI gets smarter the more you use it." },
    { icon: "🚀", title: t.tutorial_done_title || "You're All Set!", desc: t.tutorial_done_desc || "Start chatting, upload PDFs, run searches, or switch agents. Everything stays encrypted on your machine." },
  ];

  useEffect(() => {
    if (!isUnlocked) return;
    if (onboardingStep >= 0) return; // Don't show during onboarding
    if (showApiKeyModal) return;
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("hammerlock_tutorial_seen") && vaultData?.persona) {
      setTutorialStep(0);
    }
  }, [isUnlocked, onboardingStep, showApiKeyModal, vaultData]);

  const handleTutorialNext = useCallback(() => {
    if (tutorialStep >= TUTORIAL_STEPS.length - 1) {
      localStorage.setItem("hammerlock_tutorial_seen", "1");
      setTutorialStep(-1);
    } else {
      setTutorialStep(prev => prev + 1);
    }
  }, [tutorialStep, TUTORIAL_STEPS.length]);

  const handleTutorialSkip = useCallback(() => {
    localStorage.setItem("hammerlock_tutorial_seen", "1");
    setTutorialStep(-1);
  }, []);

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
    if (file.size > 10 * 1024 * 1024) { showError(t.error_pdf_large || "File too large (max 10MB)"); return; }

    const name = file.name.toLowerCase();
    const isImage = /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(name);
    const isPdf = name.endsWith(".pdf");

    if (!isPdf && !isImage) {
      showError("Supported formats: PDF, PNG, JPG, GIF, WebP");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      if (isPdf) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/pdf-parse", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) { showError(data.error || t.error_pdf_parse_failed); return; }
        setUploadedPdf({ name: file.name, text: data.text });
        setInput(prev => prev || t.chat_summarize_pdf);
        // Also save to vault for persistent access
        savePdfToVault(file.name, data.text, file.size).catch(() => {});
      } else {
        // Image: read as data URL and attach as context
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setUploadedPdf({ name: file.name, text: `[Image attached: ${file.name}]\n${dataUrl}` });
          setInput(prev => prev || "Describe this image");
        };
        reader.onerror = () => showError("Failed to read image file");
        reader.readAsDataURL(file);
      }
      inputRef.current?.focus();
    } catch (err) {
      showError((t.error_pdf_upload_failed || "Upload failed") + ": " + String(err));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [showError, t]);

  // ---- DRAG & DROP file upload ----
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer?.types?.includes("Files")) {
      setIsDraggingFile(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDraggingFile(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingFile(false);

    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    if (!isFeatureAvailable("pdf_upload")) {
      setPaywallFeature("PDF Upload"); setShowPaywall(true); return;
    }

    if (file.size > 10 * 1024 * 1024) { showError("File too large (max 10MB)"); return; }

    const name = file.name.toLowerCase();
    const isImage = /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(name);
    const isPdf = name.endsWith(".pdf");

    if (!isPdf && !isImage) {
      showError("Supported formats: PDF, PNG, JPG, GIF, WebP");
      return;
    }

    try {
      if (isPdf) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/pdf-parse", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) { showError(data.error || "Failed to parse PDF"); return; }
        setUploadedPdf({ name: file.name, text: data.text });
        setInput(prev => prev || t.chat_summarize_pdf);
        savePdfToVault(file.name, data.text, file.size).catch(() => {});
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setUploadedPdf({ name: file.name, text: `[Image attached: ${file.name}]\n${dataUrl}` });
          setInput(prev => prev || "Describe this image");
        };
        reader.onerror = () => showError("Failed to read image file");
        reader.readAsDataURL(file);
      }
      inputRef.current?.focus();
    } catch (err) {
      showError("Upload failed: " + String(err));
    }
  }, [isFeatureAvailable, showError, t]);

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
          content: t.chat_share_success(data.shareUrl, data.entryCount),
          timestamp: ts,
        }]);
        try { await navigator.clipboard.writeText(data.shareUrl); } catch { /* ok */ }
      } else { showError(data.error || t.chat_share_failed); }
    } catch(e) { showError(t.chat_share_error(String(e))); }
  }, [messages, isFeatureAvailable, showError, t]);

  // ---- EXPORT CHAT ----
  const handleExportChat = useCallback(() => {
    if (messages.length === 0) { showError(t.error_no_share); return; }
    const lines = messages.filter(m => !m.pending).map(m => {
      const who = m.role === "user" ? t.chat_sender_you : t.chat_sender_ai;
      const time = m.timestamp ? new Date(m.timestamp).toLocaleString() : "";
      return `[${who}] ${time}\n${m.content}\n`;
    });
    const text = `${t.chat_export_header}\n${"=".repeat(40)}\n\n${lines.join("\n")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hammerlock-chat-${new Date().toISOString().slice(0, 10)}.txt`;
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

  // Date bucket helper for sidebar section headers
  const getDateBucket = (isoDate: string): string => {
    const d = new Date(isoDate);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    const startOf7DaysAgo = new Date(startOfToday.getTime() - 7 * 86400000);
    if (d >= startOfToday) return "Today";
    if (d >= startOfYesterday) return "Yesterday";
    if (d >= startOf7DaysAgo) return "Previous 7 Days";
    return "Older";
  };

  // Group conversations for sidebar rendering
  const ungrouped = conversations.filter(c => !c.groupId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const grouped = groups.map(g => ({
    ...g,
    convos: conversations.filter(c => c.groupId === g.id),
  }));

  return (
    <div
      className="console-layout"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drop zone overlay */}
      {isDraggingFile && (
        <div className="drop-overlay">
          <div className="drop-overlay-content">
            <Paperclip size={48} />
            <span>Drop file here</span>
            <span className="drop-hint">PDF, PNG, JPG, GIF, WebP</span>
          </div>
        </div>
      )}
      <aside className={`console-sidebar${sidebarOpen ? "" : " collapsed"}`}>
        <div className="sidebar-scroll">
        {/* Top: New Chat */}
        <div className="sidebar-section">
          <button className="sidebar-item" onClick={handleClearChat}><Plus size={16} /> {t.sidebar_new_chat}</button>
        </div>

        {/* Conversation list — fills available space */}
        <div className="sidebar-section" style={{ flex: 1, minHeight: 80, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div className="sidebar-label" style={{ marginBottom: 0 }}>{t.sidebar_chats}</div>
            <div style={{ display: "flex", gap: 2 }}>
              <button
                className="ghost-btn"
                onClick={() => {
                  if (conversations.length <= 1) return;
                  if (confirm("Clear all chats? This can't be undone.")) {
                    setConversations([{
                      id: generateId(), name: `${t.chat_default_name} 1`, groupId: null, messages: [],
                      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                    }]);
                    setMessages([]);
                    setGroups([]);
                  }
                }}
                title="Clear all chats"
                style={{ padding: 2, opacity: conversations.length > 1 ? 0.5 : 0.2 }}
              >
                <Trash2 size={13} />
              </button>
              <button
                className="ghost-btn"
                onClick={() => setShowNewGroup(true)}
                title={t.sidebar_new_group}
                style={{ padding: 2 }}
              >
                <FolderPlus size={14} />
              </button>
            </div>
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
            {/* Ungrouped conversations with date section headers */}
            {(() => {
              let lastBucket = "";
              return ungrouped.map(convo => {
                const bucket = getDateBucket(convo.updatedAt);
                const showHeader = bucket !== lastBucket;
                lastBucket = bucket;
                return (
                  <div key={convo.id}>
                    {showHeader && (
                      <div style={{
                        fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                        color: "var(--text-muted, #666)", padding: "8px 12px 2px", marginTop: 4,
                      }}>{bucket}</div>
                    )}
                    <div
                      className={"sidebar-item" + (convo.id === activeConvoId ? " active" : "")}
                      onClick={() => switchConversation(convo.id)}
                      onContextMenu={e => { e.preventDefault(); setRenamingId(convo.id); setRenameValue(convo.name); }}
                      style={{ padding: "8px 12px", fontSize: "0.85rem", position: "relative", gap: 6 }}
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
                            color: "var(--text-primary)", fontSize: "0.85rem", padding: 0, outline: "none",
                          }}
                        />
                      ) : (
                        <span title={convo.name} style={{
                          flex: 1, overflow: "hidden", textOverflow: "ellipsis",
                          whiteSpace: "nowrap", lineHeight: 1.3,
                        }}>{convo.name}</span>
                      )}
                      {conversations.length > 1 && (
                        <button
                          className="ghost-btn sidebar-delete-btn"
                          onClick={e => { e.stopPropagation(); deleteConversation(convo.id); }}
                          style={{ padding: 1 }}
                        ><X size={12} /></button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}

            {/* Grouped conversations -- handled below */}
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
                    style={{ padding: "7px 12px 7px 24px", fontSize: "0.83rem", gap: 6 }}
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
                          color: "var(--text-primary)", fontSize: "0.83rem", padding: 0, outline: "none",
                        }}
                      />
                    ) : (
                      <span title={convo.name} style={{
                        flex: 1, overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap", lineHeight: 1.3,
                      }}>{convo.name}</span>
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

        {/* Collapsible Options section */}
        <div className="sidebar-section sidebar-options-section">
          <button
            className="sidebar-options-toggle"
            onClick={() => setOptionsOpen(prev => !prev)}
          >
            <ChevronDown
              size={14}
              style={{
                transform: optionsOpen ? "none" : "rotate(-90deg)",
                transition: "transform 0.15s",
              }}
            />
            <span>OPTIONS</span>
          </button>

          {optionsOpen && (
            <div className="sidebar-options-content">
              {/* Tools */}
              <div className="sidebar-label">{t.sidebar_tools_label}</div>
              <button className="sidebar-item" onClick={() => sendCommand("status")}><Settings size={14} /> {t.sidebar_system_status}</button>
              <button className="sidebar-item" onClick={() => sendCommand("!load-persona")}><User size={14} /> {t.sidebar_my_persona}</button>
              <button className="sidebar-item" onClick={handleGenerateReport}><BarChart3 size={14} /> {t.sidebar_generate_report}</button>
              <button className="sidebar-item" onClick={handleShare}><Share2 size={14} /> {t.sidebar_share_chat}</button>
              <button className="sidebar-item" onClick={handleExportChat}><Download size={14} /> {t.sidebar_export_chat}</button>
              <button className="sidebar-item" onClick={handleUpload}><Paperclip size={14} /> {t.sidebar_upload_pdf}</button>
              <button className="sidebar-item" onClick={() => setShowVaultPanel(true)}><Shield size={14} /> My Files {vaultFiles.length > 0 && <span style={{ marginLeft: "auto", fontSize: "0.7rem", opacity: 0.5 }}>{vaultFiles.length}</span>}</button>
              <button className="sidebar-item" onClick={() => setShowPersonalVaultPanel(true)}><Lock size={14} /> Personal Vault {pvHasVault && <span style={{ marginLeft: "auto", fontSize: "0.65rem", opacity: 0.6 }}>{pvIsUnlocked ? "Open" : "Locked"}</span>}</button>
              <button className="sidebar-item" onClick={() => setShowApiKeyModal(true)}><Key size={14} /> {t.sidebar_api_keys}</button>

              {/* Agent-specific quick commands */}
              {(() => {
                const agent = getAgentById(activeAgentId, customAgents);
                if (agent && agent.id !== "general" && agent.quickCommands.length > 0) {
                  return (
                    <>
                      <div style={{ height: 8 }} />
                      <div className="sidebar-label" style={{ color: agent.color }}>{agent.name.toUpperCase()}</div>
                      {agent.quickCommands.map(qc => (
                        <button key={qc.label} className="sidebar-item" onClick={() => {
                          if (qc.cmd.endsWith(" ")) { setInput(qc.cmd); inputRef.current?.focus(); }
                          else sendCommand(qc.cmd);
                        }}>
                          <ChevronRight size={14} /> {qc.label}
                        </button>
                      ))}
                    </>
                  );
                }
                return null;
              })()}

              {/* Agents */}
              <div style={{ height: 8 }} />
              <div className="sidebar-label">{t.sidebar_agents_label}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 200, overflowY: "auto" }}>
                {[...BUILT_IN_AGENTS, ...customAgents].map(agent => (
                  <div
                    key={agent.id}
                    onClick={() => setActiveAgentId(agent.id)}
                    title={agent.tagline}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 10px", borderRadius: 8, cursor: "pointer",
                      background: activeAgentId === agent.id ? "var(--bg-tertiary)" : "transparent",
                      border: activeAgentId === agent.id ? `1px solid ${agent.color}33` : "1px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                      background: `${agent.color}18`, color: agent.color, flexShrink: 0,
                    }}>
                      <AgentIcon name={agent.icon} size={13} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "0.75rem", fontWeight: 600,
                        color: activeAgentId === agent.id ? "var(--text-primary)" : "var(--text-secondary)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {agent.name}
                      </div>
                      {activeAgentId === agent.id && agent.id !== "general" && (
                        <div style={{
                          fontSize: "0.65rem", color: "var(--text-muted)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          marginTop: 1, lineHeight: 1.2,
                        }}>
                          {agent.tagline}
                        </div>
                      )}
                    </div>
                    {activeAgentId === agent.id && (
                      <div style={{ width: 5, height: 5, borderRadius: 3, background: agent.color, flexShrink: 0 }} />
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
                style={{ marginTop: 4, color: "var(--accent)", fontSize: "0.78rem" }}
              >
                <Plus size={14} /> {t.sidebar_create_agent}
              </button>
            </div>
          )}
        </div>

        </div>{/* end sidebar-scroll */}
        {/* Pinned bottom: Language picker + Lock */}
        <div className="sidebar-bottom">
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
          <button className="sidebar-lock" onClick={() => setShowSettings(true)} style={{ marginBottom: 4, opacity: 0.7 }}><Settings size={16} /> Settings</button>
          <button className="sidebar-lock" onClick={handleLock}><Lock size={16} /> {t.sidebar_lock}</button>
        </div>
      </aside>
      <div className="console-main" style={{position:"relative"}}>
        {/* Floating sidebar reopen button — only visible when sidebar is collapsed */}
        {!sidebarOpen && (
          <button
            className="sidebar-reopen-btn"
            onClick={() => setSidebarOpen(true)}
            title="Open sidebar"
          >
            <Menu size={18} />
          </button>
        )}
        <header className="console-topbar">
          <div className="topbar-brand" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(prev => !prev)} title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}>
              {sidebarOpen ? <PanelLeftClose size={16} /> : <Menu size={16} />}
            </button>
            <Lock size={18} /><span>HAMMERLOCK AI</span>
          </div>
          <div className="topbar-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {(() => {
              const agent = getAgentById(activeAgentId, customAgents);
              if (agent && agent.id !== "general") {
                return (
                  <button
                    className="topbar-agent-badge"
                    onClick={() => setActiveAgentId(DEFAULT_AGENT_ID)}
                    title="Click to switch back to General"
                    style={{ borderColor: `${agent.color}40`, color: agent.color }}
                  >
                    <AgentIcon name={agent.icon} size={14} />
                    <span>{agent.name}</span>
                    <X size={12} style={{ opacity: 0.5, marginLeft: 2 }} />
                  </button>
                );
              }
              return <span>{t.chat_title}</span>;
            })()}
          </div>
          <div className="topbar-actions">
            <div className="status-badge"><span className={statusDotClass} /><span className="status-label">{statusLabel}</span></div>
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
                    onClick={() => {
                      setOnboardingStep(-1);
                      updateVaultData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, onboarding_completed: new Date().toISOString() }
                      }));
                    }}
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
                  const introTips = AGENT_INTRO_TIPS[agent.id];
                  const seenAgents = Array.isArray(vaultData?.settings?.[AGENT_INTRO_SEEN_KEY])
                    ? (vaultData.settings[AGENT_INTRO_SEEN_KEY] as string[])
                    : [];
                  const hasSeenIntro = seenAgents.includes(agent.id);
                  const markIntroSeen = () => {
                    if (hasSeenIntro || !updateVaultData) return;
                    updateVaultData((prev) => {
                      const existing = Array.isArray(prev.settings[AGENT_INTRO_SEEN_KEY])
                        ? (prev.settings[AGENT_INTRO_SEEN_KEY] as string[])
                        : [];
                      if (existing.includes(agent.id)) return prev;
                      return { ...prev, settings: { ...prev.settings, [AGENT_INTRO_SEEN_KEY]: [...existing, agent.id] } };
                    });
                  };

                  // First time seeing this agent — show expanded intro card
                  if (!hasSeenIntro && introTips) {
                    return (
                      <>
                        <div className="welcome-icon-wrap" style={{ background: `${agent.color}18`, color: agent.color }}>
                          <AgentIcon name={agent.icon} size={32} />
                        </div>
                        <h2 className="empty-title" style={{ color: agent.color }}>{agent.name}</h2>
                        <p className="empty-subtitle">{agent.tagline}</p>

                        {/* Getting started tips */}
                        <div style={{
                          background: "var(--bg-card, #0a0a0a)", border: `1px solid ${agent.color}22`,
                          borderRadius: 12, padding: "16px 20px", width: "100%", maxWidth: 520,
                          marginTop: 12, marginBottom: 16, textAlign: "left",
                        }}>
                          <div style={{
                            fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
                            letterSpacing: "0.06em", color: agent.color, marginBottom: 10,
                          }}>
                            Getting Started
                          </div>
                          <ul style={{
                            margin: 0, paddingLeft: 16, listStyle: "disc",
                            color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.7,
                          }}>
                            {introTips.tips.map((tip, i) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                          {/* Example prompt */}
                          <div style={{
                            marginTop: 12, background: "var(--bg-tertiary, #111)",
                            borderRadius: 8, padding: "10px 14px",
                            fontSize: "0.82rem", color: "var(--text-secondary)", fontStyle: "italic",
                          }}>
                            <span style={{ color: agent.color, marginRight: 4, fontStyle: "normal" }}>&rsaquo;</span>
                            <strong style={{ color: "var(--text-primary)", fontStyle: "normal" }}>Try:</strong>{" "}
                            &quot;{introTips.example}&quot;
                          </div>
                        </div>

                        {/* Quick commands */}
                        <div className="suggestion-grid">
                          {agent.quickCommands.slice(0, 4).map(qc => (
                            <button key={qc.label} className="suggestion-card" onClick={() => {
                              markIntroSeen();
                              if (qc.cmd.endsWith(" ")) { setInput(qc.cmd); inputRef.current?.focus(); }
                              else sendCommand(qc.cmd);
                            }}>
                              <span className="suggestion-icon">💬</span>
                              <span className="suggestion-text">{qc.label}</span>
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={markIntroSeen}
                          style={{
                            marginTop: 8, padding: "6px 18px", borderRadius: 8,
                            background: "transparent", border: `1px solid ${agent.color}44`,
                            color: agent.color, fontSize: "0.78rem", fontWeight: 600,
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { (e.target as HTMLElement).style.background = `${agent.color}12`; }}
                          onMouseLeave={e => { (e.target as HTMLElement).style.background = "transparent"; }}
                        >
                          Got it
                        </button>
                      </>
                    );
                  }

                  // Already seen intro — compact view (existing behavior)
                  return (
                    <>
                      <div className="welcome-icon-wrap" style={{ background: `${agent.color}18`, color: agent.color }}>
                        <AgentIcon name={agent.icon} size={32} />
                      </div>
                      <h2 className="empty-title" style={{ color: agent.color }}>{agent.name}</h2>
                      <p className="empty-subtitle">{agent.tagline}</p>
                      <div className="suggestion-grid">
                        {agent.quickCommands.slice(0, 4).map(qc => (
                          <button key={qc.label} className="suggestion-card" onClick={() => {
                            if (qc.cmd.endsWith(" ")) { setInput(qc.cmd); inputRef.current?.focus(); }
                            else sendCommand(qc.cmd);
                          }}>
                            <span className="suggestion-icon">💬</span>
                            <span className="suggestion-text">{qc.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  );
                }
                const userName = vaultData?.settings?.user_name as string | undefined;
                return (
                  <>
                    <div className="welcome-icon-wrap">
                      <Lock size={32} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
                      <div className="welcome-glow" />
                    </div>
                    <h2 className="empty-title">{userName ? `${t.welcome_back || "Welcome back"}, ${userName}` : t.chat_empty_title}</h2>
                    <p className="empty-subtitle">{t.chat_empty_subtitle}</p>
                    <div className="suggestion-grid">
                      <button className="suggestion-card" onClick={() => sendCommand(t.pill_status)}>
                        <span className="suggestion-icon">⚡</span>
                        <span className="suggestion-label">{t.sidebar_system_status || "System Status"}</span>
                        <span className="suggestion-text">{t.pill_status}</span>
                      </button>
                      <button className="suggestion-card" onClick={() => sendCommand(t.pill_persona)}>
                        <span className="suggestion-icon">🧠</span>
                        <span className="suggestion-label">{t.sidebar_my_persona || "My Persona"}</span>
                        <span className="suggestion-text">{t.pill_persona}</span>
                      </button>
                      <button className="suggestion-card" onClick={() => { setInput("search "); inputRef.current?.focus(); }}>
                        <span className="suggestion-icon">🌐</span>
                        <span className="suggestion-label">{t.site_feat_search_title || "Web Search"}</span>
                        <span className="suggestion-text">{t.pill_search}</span>
                      </button>
                      <button className="suggestion-card" onClick={() => sendCommand(t.pill_report)}>
                        <span className="suggestion-icon">📊</span>
                        <span className="suggestion-label">{t.sidebar_generate_report || "Generate Report"}</span>
                        <span className="suggestion-text">{t.pill_report}</span>
                      </button>
                    </div>
                    <div className="feature-hints">
                      <div className="feature-hint">🔐 {t.site_footer_aes || "AES-256 Encrypted"}</div>
                      <div className="feature-hint">🎙️ {t.site_feat_voice_title || "Voice Input"}</div>
                      <div className="feature-hint">🤖 {t.site_feat_agents_title || "6 AI Agents"}</div>
                      <div className="feature-hint">📄 {t.site_feat_pdf_title || "PDF Upload"}</div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={msg.id} className={"console-message " + msg.role + (msg.pending ? " pending" : "")}>
              <div className="message-meta">
                <span className="message-sender">{msg.role==="user" ? t.chat_you : (getAgentById(activeAgentId, customAgents)?.name?.toLowerCase() || t.chat_ai)}</span>
                <span className="message-time">{new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</span>
              </div>
              <div className="message-content"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />}}>{msg.content}</ReactMarkdown></div>
              {msg.sources && msg.sources.length > 0 && (
                <SourcesAccordion sources={msg.sources} summary={msg.sourcesSummary} />
              )}
              {msg.actionType && !msg.pending && (
                <div className="action-badge" data-status={msg.actionStatus || "success"}>
                  <span>{msg.actionStatus === "error" ? "⚠️" : ACTION_BADGE_ICONS[msg.actionType] || "⚡"}</span>
                  <span>{ACTION_BADGE_LABELS[msg.actionType] || msg.actionType}{msg.actionStatus === "error" ? " Failed" : ""}</span>
                </div>
              )}
              {msg.followUps && msg.followUps.length > 0 && !msg.pending && msg.role === "ai"
                && idx === messages.length - 1 && !sending && (
                <div className="followup-chips">
                  {msg.followUps.map((q, i) => (
                    <button key={i} className="followup-chip" onClick={() => sendCommand(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
              {msg.pending && <div className="message-status">{t.chat_processing}</div>}

              {/* ─── WORKFLOW ACTIONS — agent-aware action buttons on AI responses ─── */}
              {!msg.pending && msg.role === "ai" && idx === messages.length - 1 && !sending && !chainRunning && (AGENT_ACTIONS[activeAgentId] || AGENT_ACTIONS.general || []).length > 0 && (
                <div className="workflow-actions" style={{
                  display: "flex", flexDirection: "column", gap: 8,
                  marginTop: 8, paddingTop: 8,
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                }}>
                  {/* Quick actions row */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(AGENT_ACTIONS[activeAgentId] || AGENT_ACTIONS.general || []).map(action => (
                      <button
                        key={action.id}
                        className="workflow-action-btn"
                        onClick={() => handleWorkflowAction(action, msg.content)}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "5px 10px", borderRadius: 6,
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                          color: "var(--text-secondary)", fontSize: "0.72rem", fontWeight: 500,
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(0,255,136,0.08)"; (e.target as HTMLElement).style.borderColor = "rgba(0,255,136,0.2)"; (e.target as HTMLElement).style.color = "var(--text-primary)"; }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.target as HTMLElement).style.color = "var(--text-secondary)"; }}
                      >
                        <span>{action.icon}</span> {action.label}
                      </button>
                    ))}
                  </div>

                  {/* Workflow chain suggestions — multi-step pipelines */}
                  {detectRelevantChains(activeAgentId, msg.content).length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {detectRelevantChains(activeAgentId, msg.content).map(chain => (
                        <button
                          key={chain.id}
                          className="workflow-chain-btn"
                          onClick={() => handleWorkflowChain(chain, msg.content)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "8px 12px", borderRadius: 8,
                            background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.12)",
                            color: "var(--accent)", fontSize: "0.75rem", fontWeight: 600,
                            cursor: "pointer", transition: "all 0.15s",
                            textAlign: "left" as const,
                          }}
                          onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(0,255,136,0.1)"; (e.target as HTMLElement).style.borderColor = "rgba(0,255,136,0.25)"; }}
                          onMouseLeave={e => { (e.target as HTMLElement).style.background = "rgba(0,255,136,0.04)"; (e.target as HTMLElement).style.borderColor = "rgba(0,255,136,0.12)"; }}
                        >
                          <span style={{ fontSize: "1rem" }}>{chain.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div>{chain.label}</div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 400, marginTop: 1 }}>
                              {chain.description}
                            </div>
                          </div>
                          <Zap size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Message action buttons — copy on all messages, extra actions on AI */}
              {!msg.pending && msg.role !== "error" && (
                <div className="message-actions">
                  <button onClick={() => handleCopy(msg.content)} title={t.msg_copy || "Copy"}>
                    <Copy size={14} />
                  </button>
                  {msg.role === "ai" && (
                    <>
                      <button
                        onClick={() => handleReadAloud(msg.id, msg.content)}
                        title={speakingMsgId === msg.id ? (t.msg_stop_reading || "Stop") : (t.msg_read_aloud || "Read aloud")}
                        className={speakingMsgId === msg.id ? "active" : ""}
                      >
                        {speakingMsgId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                      <button onClick={() => saveSnippetToVault(msg.content)} title={t.msg_save_vault || "Save to HammerLock"}>
                        <Archive size={14} />
                      </button>
                      {idx === messages.length - 1 && (
                        <button onClick={handleRegenerate} title={t.msg_regenerate || "Regenerate"}>
                          <RefreshCw size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Copied / Saved toasts */}
        {copiedToast && <div className="copied-toast">🔨 {t.msg_copied || "Nailed it! Copied."}</div>}
        {vaultSaved && <div className="copied-toast">🔐 {t.msg_saved_vault || "Hammered into the vault!"}</div>}
        {workflowToast && (
          <div className="copied-toast" style={{ background: "rgba(0,255,136,0.15)", borderColor: "rgba(0,255,136,0.3)" }}>
            🔨 {workflowToast === "Workflow complete!" ? "Nailed it! Workflow complete." : workflowToast} {chainRunning && <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>({chainStep}/{chainTotal})</span>}
          </div>
        )}

        {/* Nudge toast — contextual tips with opt-out */}
        {activeNudge && (
          <NudgeToast
            nudge={activeNudge}
            onDismiss={handleNudgeDismiss}
            onDismissPermanent={handleNudgeDismissPermanent}
            onDisableAll={handleNudgeDisableAll}
            onCta={handleNudgeCta}
          />
        )}

        {/* Settings Panel */}
        <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />

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

        {/* Hidden file input for PDF + image upload */}
        <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg" style={{ display: "none" }} onChange={handleFileChange} />
        <div className="console-input">
          {uploadedPdf && (
            <div className="input-attachment-chip">
              <Paperclip size={14} />
              <span>{uploadedPdf.name}</span>
              <button onClick={() => setUploadedPdf(null)} className="attachment-remove"><X size={12} /></button>
            </div>
          )}
          {/* @mention agent picker dropdown */}
          {showMentionMenu && mentionAgents.length > 0 && (
            <div className="mention-menu">
              {mentionAgents.map((agent, i) => (
                <button
                  key={agent.id}
                  className={`mention-item${i === mentionIndex ? " active" : ""}`}
                  onMouseDown={e => {
                    e.preventDefault();
                    setActiveAgentId(agent.id);
                    setInput(prev => prev.replace(/@\w*$/, "").trim());
                    setShowMentionMenu(false);
                    setMentionQuery("");
                    inputRef.current?.focus();
                  }}
                  onMouseEnter={() => setMentionIndex(i)}
                >
                  <span className="mention-dot" style={{ background: agent.color }} />
                  <span className="mention-name">{agent.name}</span>
                  <span className="mention-tagline">{agent.tagline}</span>
                </button>
              ))}
              <div className="mention-hint">↑↓ navigate · Enter to select · Esc to close</div>
            </div>
          )}
          <div className="input-bar">
            <button type="button" className="input-icon-btn" onClick={handleUpload} title={t.sidebar_upload_pdf}>
              <Plus size={18} />
            </button>
            <button type="button" className={`input-icon-btn${isListening ? " listening" : ""}`}
              onClick={handleVoice} title={isListening ? t.voice_stop : t.voice_start}>
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            {/* Agent chip — shows current agent, click to switch back to general */}
            {(() => {
              const agent = getAgentById(activeAgentId, customAgents);
              if (agent && agent.id !== "general") {
                return (
                  <button
                    type="button"
                    className="input-agent-chip"
                    onClick={() => setActiveAgentId(DEFAULT_AGENT_ID)}
                    title={`Using ${agent.name} — click to switch to General`}
                    style={{ borderColor: `${agent.color}40`, color: agent.color }}
                  >
                    <AgentIcon name={agent.icon} size={12} />
                    <span>{agent.name}</span>
                    <X size={10} style={{ opacity: 0.6 }} />
                  </button>
                );
              }
              return null;
            })()}
            <textarea
              ref={inputRef}
              placeholder={isListening ? t.chat_placeholder_recording : (sending ? "🔨 Hammering out a response..." : t.chat_placeholder)}
              value={input}
              onChange={e => {
                const val = e.target.value;
                setInput(val);
                // Detect @mention trigger
                const atMatch = val.match(/@(\w*)$/);
                if (atMatch) {
                  setMentionQuery(atMatch[1]);
                  setShowMentionMenu(true);
                  setMentionIndex(0);
                } else {
                  setShowMentionMenu(false);
                  setMentionQuery("");
                }
              }}
              onKeyDown={e => {
                if (showMentionMenu && mentionAgents.length > 0) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setMentionIndex(i => (i + 1) % mentionAgents.length);
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setMentionIndex(i => (i - 1 + mentionAgents.length) % mentionAgents.length);
                    return;
                  }
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    const agent = mentionAgents[mentionIndex];
                    if (agent) {
                      setActiveAgentId(agent.id);
                      // Strip @query from input
                      setInput(prev => prev.replace(/@\w*$/, "").trim());
                      setShowMentionMenu(false);
                      setMentionQuery("");
                    }
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setShowMentionMenu(false);
                    setMentionQuery("");
                    return;
                  }
                }
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendCommand(); }
              }}
            />
            <button type="button" className="send-btn" onClick={() => sendCommand()} disabled={sending || !input.trim()}>
              <Send size={16} />
            </button>
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
                ? <span style={{marginLeft:12,color:"var(--accent)"}}>{` ${subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}`}</span>
                : <span style={{marginLeft:12}}>{freeLeft > 0 ? t.chat_footer_free_left(freeLeft) : t.chat_footer_free_limit}</span>
            }
          </div>
        </div>
      </div>

      {/* ---- PERSONAL VAULT PANEL ---- */}
      <PersonalVaultPanel open={showPersonalVaultPanel} onClose={() => setShowPersonalVaultPanel(false)} />

      {/* ---- FILE VAULT PANEL ---- */}
      {showVaultPanel && (
        <div className="vault-panel-overlay" onClick={() => setShowVaultPanel(false)}>
          <div className="vault-panel" onClick={e => e.stopPropagation()}>
            <div className="vault-panel-header">
              <Shield size={18} />
              <h3>My Files</h3>
              <span className="vault-count">{vaultFiles.length} items</span>
              <button className="ghost-btn" onClick={() => setShowVaultPanel(false)} style={{marginLeft:"auto"}}><X size={16} /></button>
            </div>
            <p style={{fontSize:"0.75rem",color:"var(--text-muted)",padding:"0 16px 8px",margin:0,lineHeight:1.5}}>
              Your encrypted vault — save chat responses, upload PDFs, and create notes. Everything is AES-256 encrypted on your device.
            </p>

            {/* Search + Actions */}
            <div className="vault-panel-actions">
              <div className="vault-search-bar">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={vaultSearchQuery}
                  onChange={e => setVaultSearchQuery(e.target.value)}
                />
              </div>
              <button className="vault-action-btn" onClick={() => setShowNewNote(true)}>
                <StickyNote size={14} /> New Note
              </button>
            </div>

            {/* New Note Form */}
            {showNewNote && (
              <div className="vault-new-note">
                <input
                  type="text"
                  placeholder="Note title (optional)"
                  value={newNoteTitle}
                  onChange={e => setNewNoteTitle(e.target.value)}
                  className="vault-note-title-input"
                />
                <textarea
                  placeholder="Write your note..."
                  value={newNoteContent}
                  onChange={e => setNewNoteContent(e.target.value)}
                  className="vault-note-textarea"
                  rows={4}
                />
                <div style={{display:"flex",gap:8}}>
                  <button className="vault-save-btn" onClick={saveNoteToVault} disabled={!newNoteContent.trim()}>
                    <Check size={14} /> Save
                  </button>
                  <button className="ghost-btn" onClick={() => { setShowNewNote(false); setNewNoteTitle(""); setNewNoteContent(""); }} style={{fontSize:"0.8rem"}}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* File List */}
            <div className="vault-file-list">
              {filteredVaultFiles.length === 0 ? (
                <div className="vault-empty">
                  <Shield size={32} style={{opacity:0.2}} />
                  <p>{vaultSearchQuery ? "No matching files" : "No files yet"}</p>
                  <p style={{fontSize:"0.75rem",color:"var(--text-muted)"}}>
                    {vaultSearchQuery ? "Try a different search" : "Save chat responses, upload PDFs, or create notes to store them securely."}
                  </p>
                </div>
              ) : (
                filteredVaultFiles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(file => (
                  <div key={file.id} className="vault-file-item">
                    <div className="vault-file-icon">
                      {file.type === "pdf" ? <FileText size={16} /> :
                       file.type === "image" ? <Image size={16} /> :
                       file.type === "note" ? <StickyNote size={16} /> :
                       <File size={16} />}
                    </div>
                    <div className="vault-file-info">
                      <div className="vault-file-name">{file.name}</div>
                      <div className="vault-file-meta">
                        <span className="vault-file-type">{file.type}</span>
                        {file.size && <span>{(file.size / 1024).toFixed(1)}KB</span>}
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                      {file.tags.length > 0 && (
                        <div className="vault-file-tags">
                          {file.tags.map(tag => <span key={tag} className="vault-tag">{tag}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="vault-file-actions">
                      <button
                        className="ghost-btn"
                        title="Copy content"
                        onClick={() => handleCopy(file.content)}
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        className="ghost-btn"
                        title="Use in chat"
                        onClick={() => {
                          setUploadedPdf({ name: file.name, text: file.content.slice(0, 8000) });
                          setShowVaultPanel(false);
                        }}
                      >
                        <Send size={13} />
                      </button>
                      <button
                        className="ghost-btn vault-delete-btn"
                        title="Remove file"
                        onClick={() => deleteVaultFile(file.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {tutorialStep >= 0 && (
        <div className="tutorial-overlay" onClick={handleTutorialSkip}>
          <div className="tutorial-modal" onClick={e => e.stopPropagation()}>
            <div className="tutorial-icon">{TUTORIAL_STEPS[tutorialStep]?.icon}</div>
            <div className="tutorial-progress">
              {TUTORIAL_STEPS.map((_, i) => (
                <div key={i} className={`dot${i === tutorialStep ? " active" : i < tutorialStep ? " done" : ""}`} />
              ))}
            </div>
            <h2 className="tutorial-title">{TUTORIAL_STEPS[tutorialStep]?.title}</h2>
            <p className="tutorial-desc">{TUTORIAL_STEPS[tutorialStep]?.desc}</p>
            <div className="tutorial-actions">
              {tutorialStep < TUTORIAL_STEPS.length - 1 && (
                <button className="tutorial-skip-btn" onClick={handleTutorialSkip}>
                  {t.tutorial_skip || "Skip"}
                </button>
              )}
              <button className="tutorial-next-btn" onClick={handleTutorialNext}>
                {tutorialStep >= TUTORIAL_STEPS.length - 1 ? (t.tutorial_done || "Let's Go!") : (t.tutorial_next || "Next")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
