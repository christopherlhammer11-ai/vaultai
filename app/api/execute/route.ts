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
let cachedPersona = "";

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

async function readFileSafe(target: string) {
  return await fs.readFile(target, "utf8");
}

async function writeFileSafe(target: string, content: string) {
  await fs.writeFile(target, content, "utf8");
}

async function runStatus() {
  const { stdout } = await execAsync("node ./bin/vaultai.js status");
  return stdout.trim();
}

function sanitizePath(raw: string) {
  const trimmed = raw.replace(/^['"]|['"]$/g, "");
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
      const data = JSON.parse(raw);
      const profile = data?.profile;
      if (profile) {
        cachedPersona = `Name: ${profile.name || ""}\nRole: ${profile.role || ""}\nLocation: ${profile.location || ""}`;
        return cachedPersona;
      }
    } catch {
      /* ignore fallback */
    }
  }
  return "";
}

async function callOpenAI(systemPrompt: string, prompt: string) {
  if (!openaiClient) return null;
  const response = await openaiClient.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ]
  });
  return (
    response.output_text ||
    response.output
      ?.map((entry: any) => entry?.content?.map((c: any) => c.text).join(" "))
      .join("\n")
      .trim() ||
    null
  );
}

async function callAnthropic(systemPrompt: string, prompt: string) {
  if (!anthropicClient) return null;
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
}

async function routeToLLM(prompt: string) {
  const persona = await loadPersonaText();
  const systemPrompt = persona
    ? `Persona:\n${persona}\n\nYou are VaultAI, a local-first encrypted assistant. Be direct, cite actions, and keep secrets local.`
    : "You are VaultAI, a local-first operator assistant. Be concise and actionable.";

  const reply =
    (await callOpenAI(systemPrompt, prompt)) ||
    (await callAnthropic(systemPrompt, prompt));

  if (!reply) {
    throw new Error("No LLM provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
  }
  return reply;
}

export async function POST(req: Request) {
  const { command } = await req.json();
  if (!command || typeof command !== "string") {
    return NextResponse.json({ reply: "No command received." }, { status: 400 });
  }

  const normalized = command.trim();
  const lowered = normalized.toLowerCase();

  try {
    if (lowered.startsWith("read file")) {
      const match = normalized.match(/read file\s+(.+)/i);
      if (!match) throw new Error("Provide a file path after 'read file'.");
      const target = sanitizePath(match[1].trim());
      const content = await readFileSafe(target);
      return NextResponse.json({ reply: `### ${target}\n\n\`\`\`\n${content}\n\`\`\`` });
    }

    if (lowered.includes("load persona")) {
      cachedPersona = await loadPersonaText();
      return NextResponse.json({ reply: cachedPersona ? "Persona loaded into memory." : "No persona found." });
    }

    if (lowered.includes("tell me about myself")) {
      const persona = await loadPersonaText();
      if (!persona) {
        return NextResponse.json({ reply: "No persona loaded yet." });
      }
      return NextResponse.json({ reply: persona });
    }

    if (lowered.includes("load plan")) {
      try {
        const plan = await readFileSafe(planPath);
        return NextResponse.json({ reply: plan });
      } catch (error) {
        return NextResponse.json({ reply: (error as Error).message });
      }
    }

    if (lowered.includes("status")) {
      const status = await runStatus();
      return NextResponse.json({ reply: status });
    }

    if (lowered.startsWith("write file")) {
      const match = normalized.match(/write file\s+([^:]+)::(.+)/i);
      if (!match) {
        return NextResponse.json({ reply: "Use 'write file path :: content' to save text." });
      }
      const target = sanitizePath(match[1].trim());
      const content = match[2].trim();
      await writeFileSafe(target, content);
      return NextResponse.json({ reply: `Wrote ${content.length} characters to ${target}.` });
    }

    if (lowered.includes("execute step")) {
      return NextResponse.json({ reply: "Next step execution placeholder — integrate scheduler or CLI hook." });
    }

    const reply = await routeToLLM(normalized);
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { reply: `Command failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
