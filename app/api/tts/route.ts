import { NextResponse } from "next/server";
import path from "path";
import os from "os";
import { config as dotenvConfig } from "dotenv";

// Load user env from ~/.hammerlock/.env (for Electron packaged builds)
// If encrypted, env vars are loaded via /api/vault-session on vault unlock
try {
  const envPath = path.join(os.homedir(), ".hammerlock", ".env");
  const raw = require("fs").readFileSync(envPath, "utf8");
  if (!raw.startsWith("HAMMERLOCK_ENC:")) {
    dotenvConfig({ path: envPath });
  }
} catch { /* .env doesn't exist yet */ }

/**
 * POST /api/tts
 * Text-to-speech using OpenAI TTS API.
 * Returns audio/mpeg binary stream.
 * Falls back to empty response if no API key (client will use browser TTS).
 */
export const maxDuration = 30;

// Voices available from OpenAI TTS
// alloy (neutral), echo (male), fable (British), onyx (deep male), nova (female), shimmer (soft female)
const VALID_VOICES = new Set(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]);
const DEFAULT_VOICE = "nova";

export async function POST(req: Request) {
  try {
    const { text, voice } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Limit text length (OpenAI TTS max is 4096 chars)
    const cleanText = text
      .replace(/[#*_`~\[\]()]/g, "") // strip markdown
      .replace(/!\[.*?\]\(.*?\)/g, "") // strip images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → just the text
      .replace(/---+/g, "") // strip horizontal rules
      .replace(/\n{3,}/g, "\n\n") // collapse excessive newlines
      .trim()
      .slice(0, 4000);

    if (!cleanText) {
      return NextResponse.json({ error: "Text is empty after cleaning" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // No API key — signal client to use browser TTS fallback
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    const selectedVoice = VALID_VOICES.has(voice) ? voice : DEFAULT_VOICE;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        input: cleanText,
        voice: selectedVoice,
        response_format: "mp3",
        speed: 1.0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[tts] OpenAI TTS error:", response.status, errBody.slice(0, 300));

      // If rate limited or error, signal fallback
      return NextResponse.json({ fallback: true, error: errBody.slice(0, 200) }, { status: 200 });
    }

    // Stream the audio response back
    const audioData = await response.arrayBuffer();

    return new NextResponse(audioData, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioData.byteLength),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const msg = (error as Error).message;
    console.error("[tts] Error:", msg);

    if (msg.includes("abort")) {
      return NextResponse.json({ fallback: true, error: "TTS timed out" }, { status: 200 });
    }

    return NextResponse.json({ fallback: true, error: msg }, { status: 200 });
  }
}
