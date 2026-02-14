import { NextResponse } from "next/server";

/**
 * POST /api/configure
 * Accepts API keys from the client and sets them as environment variables
 * for the current server process. Keys are NOT persisted to disk (.env.local)
 * — the vault-encrypted client storage is the source of truth.
 *
 * On each app launch the client reads its encrypted vault, and if keys
 * are present, pushes them here so the server-side LLM routing works.
 *
 * When a user provides their OWN key, we also set VAULTAI_USER_*_KEY flags
 * so the credit system knows to skip deduction.
 *
 * Security: This endpoint is only accessible on localhost (Electron app).
 * It does NOT write keys to any file, only to process.env in memory.
 */
export async function POST(req: Request) {
  try {
    const {
      openai_api_key, anthropic_api_key, brave_api_key,
      gemini_api_key, groq_api_key, mistral_api_key,
    } = await req.json();

    let configured = 0;

    if (openai_api_key && typeof openai_api_key === "string" && openai_api_key.trim()) {
      process.env.OPENAI_API_KEY = openai_api_key.trim();
      process.env.VAULTAI_USER_OPENAI_KEY = "1";
      configured++;
    }

    if (anthropic_api_key && typeof anthropic_api_key === "string" && anthropic_api_key.trim()) {
      process.env.ANTHROPIC_API_KEY = anthropic_api_key.trim();
      process.env.VAULTAI_USER_ANTHROPIC_KEY = "1";
      configured++;
    }

    if (gemini_api_key && typeof gemini_api_key === "string" && gemini_api_key.trim()) {
      process.env.GEMINI_API_KEY = gemini_api_key.trim();
      process.env.VAULTAI_USER_GEMINI_KEY = "1";
      configured++;
    }

    if (groq_api_key && typeof groq_api_key === "string" && groq_api_key.trim()) {
      process.env.GROQ_API_KEY = groq_api_key.trim();
      process.env.VAULTAI_USER_GROQ_KEY = "1";
      configured++;
    }

    if (mistral_api_key && typeof mistral_api_key === "string" && mistral_api_key.trim()) {
      process.env.MISTRAL_API_KEY = mistral_api_key.trim();
      process.env.VAULTAI_USER_MISTRAL_KEY = "1";
      configured++;
    }

    if (brave_api_key && typeof brave_api_key === "string" && brave_api_key.trim()) {
      process.env.BRAVE_API_KEY = brave_api_key.trim();
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
