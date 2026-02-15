import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { hasCredit, deductCredit, getRemainingUnits } from "@/lib/compute-credits";
import { createAnonymizer } from "@/lib/anonymize";
// Allow longer execution for LLM calls on Vercel (default 10s is too short)
export const maxDuration = 30;

const execAsync = promisify(exec);
const personaPath = path.join(os.homedir(), ".vaultai", "persona.md");
const planPath = path.join(os.homedir(), ".vaultai", "plan.md");
const vaultJsonPath = path.join(process.cwd(), "vault.json");

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3";



let cachedPersona = "";

async function readFileSafe(target: string) {
  return await fs.readFile(target, "utf8");
}

async function runStatus() {
  const vaultExists = await fs
    .access(vaultJsonPath)
    .then(() => true)
    .catch(() => false);
  const personaExists = await fs
    .access(personaPath)
    .then(() => true)
    .catch(() => false);

  const ollamaUp = await callOllama("test", "ping").then(() => true).catch(() => false);
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasMistral = !!process.env.MISTRAL_API_KEY;
  const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
  const hasBrave = !!BRAVE_API_KEY;

  const lines = [
    `**VaultAI Status**`,
    ``,
    `Vault: ${vaultExists ? "active" : "not set up"}`,
    `Persona: ${personaExists ? "loaded" : "not found"} (${personaPath})`,
    ``,
    `**Providers**`,
    `Ollama: ${ollamaUp ? "connected" : "offline"}`,
    `OpenAI: ${hasOpenAI ? "configured" : "not set"}`,
    `Anthropic: ${hasAnthropic ? "configured" : "not set"}`,
    `Gemini: ${hasGemini ? "configured" : "not set"}`,
    `Groq: ${hasGroq ? "configured" : "not set"}`,
    `Mistral: ${hasMistral ? "configured" : "not set"}`,
    `DeepSeek: ${hasDeepSeek ? "configured" : "not set"}`,
    `Brave Search: ${hasBrave ? "configured" : "not set"}`,
  ];
  return lines.join("\n");
}

const SAFE_BASE_DIR = path.join(os.homedir(), ".vaultai");

function sanitizePath(raw: string): string {
  const trimmed = raw.replace(/^['" ]+|['" ]+$/g, "");
  // Resolve relative paths against the safe directory
  const resolved = path.isAbsolute(trimmed)
    ? path.resolve(trimmed)
    : path.resolve(SAFE_BASE_DIR, trimmed);
  // Block path traversal — resolved path must stay inside ~/.vaultai/
  if (!resolved.startsWith(SAFE_BASE_DIR + path.sep) && resolved !== SAFE_BASE_DIR) {
    throw new Error("Access denied: file reads are restricted to ~/.vaultai/");
  }
  return resolved;
}


async function loadPersonaText() {
  if (cachedPersona) return cachedPersona;
  try {
    cachedPersona = await fs.readFile(personaPath, "utf8");
    return cachedPersona;
  } catch {
    try {
      const raw = await fs.readFile(vaultJsonPath, "utf8");
      const parsed = JSON.parse(raw);
      const profile = parsed?.profile;
      if (profile) {
        cachedPersona = `Name: ${profile.name || ""}\nRole: ${profile.role || ""}\nLocation: ${profile.location || ""}`;
        return cachedPersona;
      }
    } catch {
      /* ignore */
    }
  }
  return "";
}

async function callOllama(systemPrompt: string, prompt: string) {
  // Skip Ollama in serverless environments — localhost is not available
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        stream: false
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = await response.json();
    return data.message?.content?.trim() || null;
  } catch (error) {
    console.error("Ollama call failed, falling back:", (error as Error).message);
    return null;
  }
}

async function callOpenAI(systemPrompt: string, prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errBody = await response.text();
      lastLLMError = `OpenAI ${response.status}: ${errBody.slice(0, 200)}`;
      console.error("[execute] OpenAI API error:", response.status, errBody.slice(0, 300));
      return null;
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      lastLLMError = "OpenAI returned empty response";
      return null;
    }
    return content;
  } catch (error) {
    lastLLMError = `OpenAI: ${(error as Error).message}`;
    console.error("OpenAI call failed, falling back:", (error as Error).message);
    return null;
  }
}

async function callAnthropic(systemPrompt: string, prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929",
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errBody = await response.text();
      lastLLMError = `Anthropic ${response.status}: ${errBody.slice(0, 200)}`;
      console.error("[execute] Anthropic API error:", response.status, errBody.slice(0, 300));
      return null;
    }
    const data = await response.json();
    return (
      data.content
        ?.map((part: { type: string; text?: string }) => (part.type === "text" ? part.text : ""))
        .join("\n")
        .trim() || null
    );
  } catch (error) {
    lastLLMError = `Anthropic: ${(error as Error).message}`;
    console.error("Anthropic call failed, falling back:", (error as Error).message);
    return null;
  }
}

async function callGemini(systemPrompt: string, prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errBody = await response.text();
      lastLLMError = `Gemini ${response.status}: ${errBody.slice(0, 200)}`;
      console.error("[execute] Gemini API error:", response.status, errBody.slice(0, 300));
      return null;
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      lastLLMError = "Gemini returned empty response";
      return null;
    }
    return text;
  } catch (error) {
    lastLLMError = `Gemini: ${(error as Error).message}`;
    console.error("Gemini call failed, falling back:", (error as Error).message);
    return null;
  }
}

async function callGroq(systemPrompt: string, prompt: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    // Groq uses OpenAI-compatible API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errBody = await response.text();
      lastLLMError = `Groq ${response.status}: ${errBody.slice(0, 200)}`;
      console.error("[execute] Groq API error:", response.status, errBody.slice(0, 300));
      return null;
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      lastLLMError = "Groq returned empty response";
      return null;
    }
    return content;
  } catch (error) {
    lastLLMError = `Groq: ${(error as Error).message}`;
    console.error("Groq call failed, falling back:", (error as Error).message);
    return null;
  }
}

async function callMistral(systemPrompt: string, prompt: string) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.MISTRAL_MODEL || "mistral-small-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errBody = await response.text();
      lastLLMError = `Mistral ${response.status}: ${errBody.slice(0, 200)}`;
      console.error("[execute] Mistral API error:", response.status, errBody.slice(0, 300));
      return null;
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      lastLLMError = "Mistral returned empty response";
      return null;
    }
    return content;
  } catch (error) {
    lastLLMError = `Mistral: ${(error as Error).message}`;
    console.error("Mistral call failed, falling back:", (error as Error).message);
    return null;
  }
}

async function callDeepSeek(systemPrompt: string, prompt: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    // DeepSeek uses OpenAI-compatible API
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errBody = await response.text();
      lastLLMError = `DeepSeek ${response.status}: ${errBody.slice(0, 200)}`;
      console.error("[execute] DeepSeek API error:", response.status, errBody.slice(0, 300));
      return null;
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      lastLLMError = "DeepSeek returned empty response";
      return null;
    }
    return content;
  } catch (error) {
    lastLLMError = `DeepSeek: ${(error as Error).message}`;
    console.error("DeepSeek call failed, falling back:", (error as Error).message);
    return null;
  }
}

// Track the last LLM error for better diagnostics in serverless
let lastLLMError: string | null = null;

async function callGateway(prompt: string): Promise<string> {
  // Skip CLI gateway in serverless environments (it doesn't exist there)
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) {
    const detail = lastLLMError ? ` Last error: ${lastLLMError}` : "";
    throw new Error(
      `No LLM provider responded.${detail} Check that your API key is valid.`
    );
  }

  try {
    const escaped = prompt.replace(/'/g, "'\\''");
    const { stdout } = await execAsync(
      `openclaw --profile vaultai agent --agent main --message '${escaped}' --json --no-color`,
      { timeout: 30000 }
    );
    const result = JSON.parse(stdout);
    if (result.status === "ok") {
      return result.result?.payloads?.[0]?.text || "No response from gateway agent";
    }
    throw new Error(result.summary || "Gateway agent failed");
  } catch (error) {
    throw new Error(
      `No LLM provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY, or ensure the OpenClaw gateway is running. (${(error as Error).message})`
    );
  }
}

async function routeToLLM(prompt: string, options?: { context?: string; userProfile?: { name?: string; role?: string; industry?: string; context?: string } | null; agentSystemPrompt?: string; locale?: string }) {
  const persona = await loadPersonaText();
  let profileSnippet = "";
  if (options?.userProfile) {
    const p = options.userProfile;
    const parts: string[] = [];
    if (p.name) parts.push(`Name: ${p.name}`);
    if (p.role) parts.push(`Role: ${p.role}`);
    if (p.industry) parts.push(`Industry: ${p.industry}`);
    if (p.context) parts.push(`Notes: ${p.context}`);
    if (parts.length > 0) profileSnippet = `\n\nUser Profile:\n${parts.join("\n")}`;
  }

  // Use agent-specific system prompt if provided, otherwise default
  let systemPrompt: string;
  const brevityRule = "\n\nRESPONSE RULES: Keep replies SHORT (2-4 sentences for simple questions). Match your response length to the complexity of the question. For a greeting like 'hello', reply with a single friendly sentence. Never over-explain. Never list capabilities unless explicitly asked. Be warm and natural, not robotic.";
  if (options?.agentSystemPrompt) {
    systemPrompt = options.agentSystemPrompt + (persona ? `\n\nUser Persona:\n${persona}` : "") + profileSnippet + brevityRule;
  } else {
    systemPrompt = persona
      ? `Persona:\n${persona}${profileSnippet}\n\nYou are VaultAI, a local-first encrypted assistant. Be helpful, concise, and natural.${brevityRule}`
      : `You are VaultAI, a local-first assistant. Be helpful, concise, and natural.${profileSnippet}${brevityRule}`;
  }

  // Inject language instruction if user selected a non-English locale
  if (options?.locale && options.locale !== "en") {
    const langName = LOCALE_LANG[options.locale] || options.locale;
    const langInstruction = `\n\n⚠️ CRITICAL LANGUAGE REQUIREMENT: You MUST respond ENTIRELY in ${langName}. The user has selected ${langName} as their language. Every word of your response must be in ${langName}. Do NOT respond in English. Do NOT mix languages. Respond ONLY in ${langName}.`;
    systemPrompt = langInstruction + "\n\n" + systemPrompt + langInstruction;
  }

  const userPrompt = options?.context ? `${options.context}\n\n${prompt}` : prompt;

  // ---- Anonymization layer ----
  // For local providers (Ollama), skip anonymization — data stays on-device.
  // For cloud providers (OpenAI, Anthropic), scrub PII before sending.
  const anon = createAnonymizer(persona, options?.userProfile);

  // Try local first (no anonymization needed)
  const localReply = await callOllama(systemPrompt, userPrompt);
  if (localReply) return localReply;

  // Cloud providers: anonymize outbound, de-anonymize response
  const scrubbedSystem = anon.scrub(systemPrompt);
  const scrubbedUser = anon.scrub(userPrompt);

  if (anon.detectedCount > 0) {
    console.log(`[anonymize] Scrubbed ${anon.detectedCount} PII items (${anon.summary})`);
  }

  const cloudReply =
    (await callOpenAI(scrubbedSystem, scrubbedUser)) ??
    (await callAnthropic(scrubbedSystem, scrubbedUser)) ??
    (await callGemini(scrubbedSystem, scrubbedUser)) ??
    (await callGroq(scrubbedSystem, scrubbedUser)) ??
    (await callMistral(scrubbedSystem, scrubbedUser)) ??
    (await callDeepSeek(scrubbedSystem, scrubbedUser));

  if (cloudReply) return anon.restore(cloudReply);

  return await callGateway(userPrompt);
}

const SEARCH_PATTERNS = [
  /^(?:web\s+)?search\s+(.+)/i,
  /^find\s+(.+)/i,
  /^latest on\s+(.+)/i,
  /^look up\s+(.+)/i
];

function extractSearchQuery(command: string): string | null {
  for (const pattern of SEARCH_PATTERNS) {
    const match = command.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  if (command.toLowerCase().includes(" search ")) {
    return command.replace(/.*search\s+/i, "").trim();
  }
  return null;
}

type BraveResult = {
  title: string;
  url: string;
  snippet: string;
  age: string;
};

async function fetchBraveResults(query: string): Promise<BraveResult[]> {
  if (!BRAVE_API_KEY) {
    throw new Error("Add BRAVE_API_KEY to .env.local");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
      {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": BRAVE_API_KEY
        },
        signal: controller.signal
      }
    );
    if (!res.ok) {
      throw new Error(`Brave API error: ${res.status}`);
    }
    const data = await res.json();
    const items = data?.web?.results || [];
    return items.slice(0, 5).map((item: any) => ({
      title: item?.title || item?.url || "Untitled result",
      url: item?.url || "",
      snippet: item?.description || item?.snippet || "No snippet provided.",
      age: item?.page_age || item?.age || item?.publishedDate || "Unknown"
    }));
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Search timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function formatBraveResults(results: BraveResult[]) {
  const lines = ["Results:"];
  results.forEach((result, idx) => {
    lines.push(`[${idx + 1}] ${result.title} - ${result.url}`);
    lines.push(`   Snippet: ${result.snippet}`);
    lines.push(`   Age: ${result.age}`);
    lines.push("");
  });
  return lines.join("\n").trim();
}

// Map locale codes to full language names for LLM instruction
const LOCALE_LANG: Record<string, string> = {
  en: "English", "pt-BR": "Brazilian Portuguese", es: "Spanish",
  fr: "French", de: "German", zh: "Chinese", ja: "Japanese",
  ko: "Korean", ar: "Arabic", hi: "Hindi", ru: "Russian",
};

// Server-side i18n for API responses shown in chat feed
const API_STRINGS: Record<string, Record<string, string>> = {
  en: {
    no_command: "No command received.",
    no_search: "No search results found.",
    no_persona: "No persona set up yet. Tell me about yourself!",
    no_persona_alt: "No persona set up yet. Tell me about yourself and I'll remember it.",
    remember_saved: "Got it, I'll remember that:",
    remember_failed: "Couldn't save that right now. Try again?",
    credits_exhausted: "You've used all your included compute units. To keep going, you can **add your own API key** (sidebar > API Keys) for unlimited use, or **get more units** from the VaultAI store.",
    generic_error: "Something went wrong. Please try again.",
    your_persona: "Your Persona",
  },
  "pt-BR": {
    no_command: "Nenhum comando recebido.",
    no_search: "Nenhum resultado de busca encontrado.",
    no_persona: "Nenhum perfil configurado ainda. Me conte sobre você!",
    no_persona_alt: "Nenhum perfil configurado ainda. Me conte sobre você e eu vou lembrar.",
    remember_saved: "Entendi, vou lembrar disso:",
    remember_failed: "Não consegui salvar agora. Tenta de novo?",
    credits_exhausted: "Você usou todas as suas unidades de computação incluídas. Para continuar, você pode **adicionar sua própria chave API** (barra lateral > Chaves API) para uso ilimitado, ou **obter mais unidades** na loja VaultAI.",
    generic_error: "Algo deu errado. Tente novamente.",
    your_persona: "Seu Perfil",
  },
  es: {
    no_command: "No se recibió ningún comando.",
    no_search: "No se encontraron resultados de búsqueda.",
    no_persona: "No hay persona configurada aún. ¡Cuéntame sobre ti!",
    no_persona_alt: "No hay persona configurada aún. Cuéntame sobre ti y lo recordaré.",
    remember_saved: "Entendido, recordaré eso:",
    remember_failed: "No pude guardar eso ahora. ¿Intentar de nuevo?",
    credits_exhausted: "Has usado todas tus unidades de cómputo incluidas. Para continuar, puedes **agregar tu propia clave API** (barra lateral > Claves API) para uso ilimitado.",
    generic_error: "Algo salió mal. Inténtalo de nuevo.",
    your_persona: "Tu Persona",
  },
};

function apiStr(locale: string | undefined, key: string): string {
  const loc = locale && API_STRINGS[locale] ? locale : "en";
  return API_STRINGS[loc]?.[key] || API_STRINGS.en[key] || key;
}

export async function POST(req: Request) {
  const { command, userProfile, agentSystemPrompt, locale } = await req.json();
  if (!command || typeof command !== "string") {
    return NextResponse.json({ response: apiStr(locale, "no_command") }, { status: 400 });
  }

  const normalized = command.trim();

  // Determine request type for credit tracking
  const isSearch = !!extractSearchQuery(normalized);
  const requestType = isSearch ? "search" : "chat";

  // Check compute credits (desktop only — serverless uses user's own key always)
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (!isServerless) {
    const hasCreditAvailable = await hasCredit(requestType);
    if (!hasCreditAvailable) {
      const remaining = await getRemainingUnits();
      return NextResponse.json({
        response: apiStr(locale, "credits_exhausted"),
        creditExhausted: true,
        remainingUnits: remaining,
      });
    }
  }

  try {
    const searchQuery = extractSearchQuery(normalized);
    if (searchQuery) {
      // Anonymize the search query before sending to Brave
      const persona = await loadPersonaText();
      const searchAnon = createAnonymizer(persona, userProfile);
      const scrubbedQuery = searchAnon.scrub(searchQuery);

      const results = await fetchBraveResults(scrubbedQuery);
      if (!results.length) {
        return NextResponse.json({ response: apiStr(locale, "no_search") });
      }
      const formattedResults = formatBraveResults(results);
      const context = `Use these web results to answer accurately and cite sources with markdown links like [1](URL):\n${formattedResults}\n\nEach citation should refer to the corresponding URL. Query: ${searchQuery}`;
      const reply = await routeToLLM(
        `Provide a concise answer to: ${searchQuery}. Mention the freshness of info if possible and cite sources inline.`,
        { context, userProfile, agentSystemPrompt, locale }
      );
      if (!isServerless) await deductCredit("search");
      // De-anonymize the response in case any placeholders leaked through
      return NextResponse.json({ response: searchAnon.restore(reply) });
    }

    const lowered = normalized.toLowerCase();

    if (lowered.includes("status")) {
      const status = await runStatus();
      return NextResponse.json({ response: status });
    }

    if (lowered.includes("load persona") || lowered.includes("tell me about myself")) {
      try {
        const persona = await readFileSafe(personaPath);
        return NextResponse.json({ response: persona ? `**${apiStr(locale, "your_persona")}:**\n\n${persona}` : apiStr(locale, "no_persona") });
      } catch {
        return NextResponse.json({ response: apiStr(locale, "no_persona_alt") });
      }
    }

    // Handle "remember" commands — append to persona file
    const rememberMatch = normalized.match(/^(?:remember|note|save|update persona)[:\s]+(.+)/i);
    if (rememberMatch && rememberMatch[1]) {
      const note = rememberMatch[1].trim();
      try {
        let existing = "";
        try { existing = await fs.readFile(personaPath, "utf8"); } catch { /* new file */ }
        const updated = existing ? `${existing}\n${note}` : note;
        await fs.mkdir(path.dirname(personaPath), { recursive: true });
        await fs.writeFile(personaPath, updated, "utf8");
        cachedPersona = updated; // refresh cache
        return NextResponse.json({ response: `${apiStr(locale, "remember_saved")} "${note}"` });
      } catch {
        return NextResponse.json({ response: apiStr(locale, "remember_failed") });
      }
    }

    if (lowered.startsWith("read file")) {
      const match = normalized.match(/read file\s+(.+)/i);
      if (!match) throw new Error("Provide a file path after 'read file'.");
      const target = sanitizePath(match[1].trim());
      const content = await readFileSafe(target);
      return NextResponse.json({ response: `### ${target}\n\n${content}` });
    }

    if (lowered.includes("load plan")) {
      const plan = await readFileSafe(planPath);
      return NextResponse.json({ response: plan });
    }

    const reply = await routeToLLM(normalized, { userProfile, agentSystemPrompt, locale });
    if (!isServerless) await deductCredit("chat");
    return NextResponse.json({ response: reply });
  } catch (error) {
    const message = (error as Error).message;
    console.error("[execute] Error:", message);
    // Only surface safe, known error messages to the client
    const SAFE_ERRORS = [
      "Search timed out",
      "Add BRAVE_API_KEY to .env.local",
      "Access denied: file reads are restricted to ~/.vaultai/",
      "Provide a file path after 'read file'.",
      "No LLM provider configured",
      "No LLM provider responded",
    ];
    const isSafe = SAFE_ERRORS.some((e) => message.includes(e));
    const friendly = isSafe ? message : apiStr(locale, "generic_error");
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
