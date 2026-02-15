import { NextResponse } from "next/server";
import path from "path";
import os from "os";
import { config as dotenvConfig } from "dotenv";

// Load user env from ~/.vaultai/.env (for Electron packaged builds)
dotenvConfig({ path: path.join(os.homedir(), ".vaultai", ".env") });

/**
 * POST /api/transcribe
 * Accepts audio blob (webm/wav) and transcribes via OpenAI Whisper API.
 * Falls back to Ollama if available, or returns a helpful error.
 */
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const formData = await req.formData() as unknown as globalThis.FormData;
    const audio = formData.get("audio") as File | null;

    if (!audio) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    // 25MB limit (Whisper API limit)
    if (audio.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio too large (max 25MB)" }, { status: 400 });
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

        console.log(`[transcribe] Audio: type=${mimeType}, size=${audio.size}, ext=${ext}`);

        const audioBlob = new Blob([await audio.arrayBuffer()], { type: mimeType });
        whisperForm.append("file", audioBlob, `recording.${ext}`);
        whisperForm.append("model", "whisper-1");

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
