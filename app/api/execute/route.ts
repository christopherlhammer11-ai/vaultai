import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import fs from "fs/promises";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const execAsync = promisify(exec);
const personaPath = path.join(os.homedir(), "vault", "persona-chris.md");
const planPath = path.join(os.homedir(), "vault", "vaultai-plan.md");
const vaultJsonPath = path.join(process.cwd(), "vault.json");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3";

const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
const anthropicClient = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

let cachedPersona = "";

async function readFileSafe(target: string) {
  return await fs.readFile(target, "utf8");
}

async function runStatus() {
  const vaultExists = await fs
    .access(vaultJsonPath)
    .then(() => true)
    .catch(() => false);
  const lines = [
    `Vault path: ${vaultJsonPath}`,
    `Persona path: ${personaPath}`,
    `Vault.json ${vaultExists ? "found" : "missing"}`,
    `Status: ${vaultExists ? "healthy" : "needs setup"}`
  ];
  try {
    const { stdout } = await execAsync("node ./bin/vaultai.js status");
    lines.push("\nCLI status:", stdout.trim());
  } catch (error) {
    lines.push(`\nCLI status unavailable: ${(error as Error).message}`);
  }
  return lines.join("\n");
}

function sanitizePath(raw: string) {
  const trimmed = raw.replace(/^['" ]+|['" ]+$/g, "");
  if (path.isAbsolute(trimmed)) return trimmed;
  return path.join(process.cwd(), trimmed);
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
  if (!openaiClient) return null;
  try {
    const response = await openaiClient.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ]
    });
    return response.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("OpenAI call failed, falling back:", (error as Error).message);
    return null;
  }
}

async function callAnthropic(systemPrompt: string, prompt: string) {
  if (!anthropicClient) return null;
  try {
    const response = await anthropicClient.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }]
    });
    return (
      response.content
        ?.map((part) => (part.type === "text" ? part.text : ""))
        .join("\n")
        .trim() || null
    );
  } catch (error) {
    console.error("Anthropic call failed, falling back:", (error as Error).message);
    return null;
  }
}

async function callGateway(prompt: string): Promise<string> {
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

async function routeToLLM(prompt: string, options?: { context?: string; userProfile?: { name?: string; role?: string; industry?: string; context?: string } | null }) {
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
  const systemPrompt = persona
    ? `Persona:\n${persona}${profileSnippet}\n\nYou are VaultAI, a local-first encrypted operator assistant. Be direct, cite actions, and keep data local.`
    : `You are VaultAI, a local-first operator assistant. Be concise and actionable.${profileSnippet}`;

  const userPrompt = options?.context ? `${options.context}\n\n${prompt}` : prompt;

  // Local-first: try Ollama, then cloud APIs, then OpenClaw gateway
  const reply =
    (await callOllama(systemPrompt, userPrompt)) ??
    (await callOpenAI(systemPrompt, userPrompt)) ??
    (await callAnthropic(systemPrompt, userPrompt));

  if (reply) return reply;

  // Last resort: route through OpenClaw gateway
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

export async function POST(req: Request) {
  const { command, userProfile } = await req.json();
  if (!command || typeof command !== "string") {
    return NextResponse.json({ response: "No command received." }, { status: 400 });
  }

  const normalized = command.trim();

  try {
    const searchQuery = extractSearchQuery(normalized);
    if (searchQuery) {
      const results = await fetchBraveResults(searchQuery);
      if (!results.length) {
        return NextResponse.json({ response: "No search results found." });
      }
      const formattedResults = formatBraveResults(results);
      const context = `Use these web results to answer accurately and cite sources with markdown links like [1](URL):\n${formattedResults}\n\nEach citation should refer to the corresponding URL. Query: ${searchQuery}`;
      const reply = await routeToLLM(
        `Provide a concise answer to: ${searchQuery}. Mention the freshness of info if possible and cite sources inline.`,
        { context, userProfile }
      );
      return NextResponse.json({ response: reply });
    }

    const lowered = normalized.toLowerCase();

    if (lowered.includes("status")) {
      const status = await runStatus();
      return NextResponse.json({ response: status });
    }

    if (lowered.includes("load persona") || lowered.includes("tell me about myself")) {
      const persona = await readFileSafe(personaPath);
      return NextResponse.json({ response: persona });
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

    const reply = await routeToLLM(normalized, { userProfile });
    return NextResponse.json({ response: reply });
  } catch (error) {
    const message = (error as Error).message;
    const friendly = message.includes("Search timed out")
      ? "Search timed out"
      : message === "Add BRAVE_API_KEY to .env.local"
        ? message
        : `Error: ${message}`;
    return NextResponse.json({ response: friendly }, { status: 500 });
  }
}
