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
 * POST /api/transcribe
 * Accepts audio blob (webm/wav) and transcribes via OpenAI Whisper API.
 * Falls back to Ollama if available, or returns a helpful error.
 */
export const maxDuration = 30;

// Known Whisper hallucinations when receiving near-silence or very short audio
const WHISPER_HALLUCINATIONS = new Set([
  "you", "thank you", "thanks", "bye", "the end", "thanks for watching",
  "thank you for watching", "subscribe", "like and subscribe",
  "please subscribe", "see you next time", "goodbye",
  // Whisper sometimes echoes the prompt back as the transcription
  "the user is speaking a command or question to an ai assistant called hammerlock",
  "the user is speaking a command or question to an ai assistant called hammerlock.",
]);

// Map locale codes to Whisper language codes
const LOCALE_TO_WHISPER: Record<string, string> = {
  en: "en", pt: "pt", es: "es", fr: "fr", de: "de",
  zh: "zh", ja: "ja", ko: "ko", ar: "ar", hi: "hi", ru: "ru",
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData() as unknown as globalThis.FormData;
    const audio = formData.get("audio") as File | null;
    const locale = (formData.get("locale") as string) || "en";

    if (!audio) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    // 25MB limit (Whisper API limit)
    if (audio.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio too large (max 25MB)" }, { status: 400 });
    }

    // Reject very small audio (likely silence or <1 second)
    if (audio.size < 2000) {
      return NextResponse.json({ error: "Recording too short. Please speak for at least 1-2 seconds." }, { status: 400 });
    }

    // Try OpenAI Whisper first
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const whisperForm = new FormData();
        // Detect the correct file extension for Whisper API
        const mimeType = audio.type || "audio/webm";
        let ext = "webm";
        if (mimeType.includes("mp4") || mimeType.includes("m4a")) ext = "mp4";
        else if (mimeType.includes("wav")) ext = "wav";
        else if (mimeType.includes("ogg")) ext = "ogg";
        else if (mimeType.includes("mpeg") || mimeType.includes("mp3")) ext = "mp3";

        console.log(`[transcribe] Audio: type=${mimeType}, size=${audio.size}, ext=${ext}, locale=${locale}`);

        const audioBlob = new Blob([await audio.arrayBuffer()], { type: mimeType });
        whisperForm.append("file", audioBlob, `recording.${ext}`);
        whisperForm.append("model", "whisper-1");
        // Language hint prevents wrong-language hallucinations
        const whisperLang = LOCALE_TO_WHISPER[locale] || "en";
        whisperForm.append("language", whisperLang);
        // Temperature 0 = more deterministic, fewer hallucinations
        whisperForm.append("temperature", "0");
        // Prompt gives Whisper context about expected content
        whisperForm.append("prompt", "The user is speaking a command or question to an AI assistant called HammerLock AI.");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${openaiKey}` },
          body: whisperForm,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const text = data.text?.trim();
          if (text) {
            // Filter known Whisper hallucinations
            const normalized = text.toLowerCase().replace(/[.,!?]/g, "").trim();
            const isHallucination =
              WHISPER_HALLUCINATIONS.has(normalized) ||
              // Whisper sometimes echoes parts of the context prompt back
              normalized.includes("speaking a command") ||
              normalized.includes("ai assistant called hammerlock") ||
              normalized.includes("user is speaking");
            if (isHallucination) {
              console.log(`[transcribe] Filtered Whisper hallucination: "${text}"`);
              return NextResponse.json(
                { error: "Could not understand the recording. Please speak clearly and try again." },
                { status: 422 }
              );
            }
            return NextResponse.json({ text, provider: "whisper" });
          }
          console.log("[transcribe] Whisper returned empty text");
        } else {
          const errBody = await res.text();
          console.error("[transcribe] Whisper API error:", res.status, errBody.slice(0, 500));
          // Return specific error so UI can show it
          return NextResponse.json(
            { error: `Whisper API error (${res.status}): ${errBody.slice(0, 200)}` },
            { status: res.status }
          );
        }
      } catch (err) {
        const msg = (err as Error).message;
        console.error("[transcribe] Whisper failed:", msg);
        if (msg.includes("abort")) {
          return NextResponse.json({ error: "Transcription timed out. Try a shorter recording." }, { status: 408 });
        }
      }
    }

    // Try Anthropic (no native transcription, skip)

    // Try Ollama with a whisper model if available (local whisper)
    const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    if (!isServerless) {
      // Could add local whisper.cpp support here in the future
    }

    // No provider available
    return NextResponse.json(
      {
        error: "Voice transcription requires an OpenAI API key. Add OPENAI_API_KEY to your .env.local file.",
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("[transcribe] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Transcription failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}
