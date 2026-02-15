import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";

const ENV_FILE = path.join(os.homedir(), ".vaultai", ".env");

/**
 * POST /api/configure
 * Accepts API keys from the client and sets them as environment variables
 * for the current server process. Keys are also persisted to ~/.vaultai/.env
 * so they survive app restarts.
 *
 * When a user provides their OWN key, we also set VAULTAI_USER_*_KEY flags
 * so the credit system knows to skip deduction.
 *
 * Security: This endpoint is only accessible on localhost (Electron app).
 */

async function persistEnv(key: string, value: string) {
  try {
    await fs.mkdir(path.dirname(ENV_FILE), { recursive: true });
    let content = "";
    try { content = await fs.readFile(ENV_FILE, "utf8"); } catch { /* new file */ }
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content = content.trimEnd() + `\n${key}=${value}\n`;
    }
    await fs.writeFile(ENV_FILE, content, "utf8");
  } catch { /* silent — env persistence is best-effort */ }
}
export async function POST(req: Request) {
  try {
    const {
      openai_api_key, anthropic_api_key, brave_api_key,
      gemini_api_key, groq_api_key, mistral_api_key, deepseek_api_key,
    } = await req.json();

    let configured = 0;

    if (openai_api_key && typeof openai_api_key === "string" && openai_api_key.trim()) {
      process.env.OPENAI_API_KEY = openai_api_key.trim();
      process.env.VAULTAI_USER_OPENAI_KEY = "1";
      await persistEnv("OPENAI_API_KEY", openai_api_key.trim());
      configured++;
    }

    if (anthropic_api_key && typeof anthropic_api_key === "string" && anthropic_api_key.trim()) {
      process.env.ANTHROPIC_API_KEY = anthropic_api_key.trim();
      process.env.VAULTAI_USER_ANTHROPIC_KEY = "1";
      await persistEnv("ANTHROPIC_API_KEY", anthropic_api_key.trim());
      configured++;
    }

    if (gemini_api_key && typeof gemini_api_key === "string" && gemini_api_key.trim()) {
      process.env.GEMINI_API_KEY = gemini_api_key.trim();
      process.env.VAULTAI_USER_GEMINI_KEY = "1";
      await persistEnv("GEMINI_API_KEY", gemini_api_key.trim());
      configured++;
    }

    if (groq_api_key && typeof groq_api_key === "string" && groq_api_key.trim()) {
      process.env.GROQ_API_KEY = groq_api_key.trim();
      process.env.VAULTAI_USER_GROQ_KEY = "1";
      await persistEnv("GROQ_API_KEY", groq_api_key.trim());
      configured++;
    }

    if (mistral_api_key && typeof mistral_api_key === "string" && mistral_api_key.trim()) {
      process.env.MISTRAL_API_KEY = mistral_api_key.trim();
      process.env.VAULTAI_USER_MISTRAL_KEY = "1";
      await persistEnv("MISTRAL_API_KEY", mistral_api_key.trim());
      configured++;
    }

    if (deepseek_api_key && typeof deepseek_api_key === "string" && deepseek_api_key.trim()) {
      process.env.DEEPSEEK_API_KEY = deepseek_api_key.trim();
      process.env.VAULTAI_USER_DEEPSEEK_KEY = "1";
      await persistEnv("DEEPSEEK_API_KEY", deepseek_api_key.trim());
      configured++;
    }

    if (brave_api_key && typeof brave_api_key === "string" && brave_api_key.trim()) {
      process.env.BRAVE_API_KEY = brave_api_key.trim();
      await persistEnv("BRAVE_API_KEY", brave_api_key.trim());
      configured++;
    }

    return NextResponse.json({
      status: "ok",
      configured,
      usingOwnKey: configured > 0,
      providers: {
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        gemini: !!process.env.GEMINI_API_KEY,
        groq: !!process.env.GROQ_API_KEY,
        mistral: !!process.env.MISTRAL_API_KEY,
        deepseek: !!process.env.DEEPSEEK_API_KEY,
        brave: !!process.env.BRAVE_API_KEY,
      },
    });
  } catch (error) {
    console.error("[configure] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Configuration failed" },
      { status: 500 }
    );
  }
}
