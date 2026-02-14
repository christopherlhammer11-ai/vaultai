import { NextResponse } from "next/server";
import { Anonymizer } from "@/lib/anonymize";

/**
 * POST /api/report
 * Generates a scheduled report summary from provided chat history.
 * The client sends its encrypted chat history (already decrypted client-side)
 * and this endpoint asks the LLM to create a digest.
 *
 * PII is scrubbed before hitting cloud LLMs and restored in the response.
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3";

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  // Create anonymizer from the chat content to scrub PII for cloud providers
  const anon = new Anonymizer();

  // Try Ollama first (local — no anonymization needed)
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (!isServerless) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const text = data.message?.content?.trim();
        if (text) return text;
      }
    } catch {
      /* fall through to cloud */
    }
  }

  // Cloud providers: anonymize before sending
  const scrubbedSystem = anon.scrub(systemPrompt);
  const scrubbedUser = anon.scrub(userPrompt);

  // Try OpenAI (anonymized)
  if (process.env.OPENAI_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: scrubbedSystem },
            { role: "user", content: scrubbedUser },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return anon.restore(text);
      }
    } catch {
      /* fall through */
    }
  }

  // Try Anthropic (anonymized)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929",
          max_tokens: 800,
          system: scrubbedSystem,
          messages: [{ role: "user", content: scrubbedUser }],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const text = data.content?.map((p: { type: string; text?: string }) => p.type === "text" ? p.text : "").join("\n").trim();
        if (text) return anon.restore(text);
      }
    } catch { /* fall through */ }
  }

  // Try Gemini (anonymized)
  if (process.env.GEMINI_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: scrubbedSystem }] },
            contents: [{ role: "user", parts: [{ text: scrubbedUser }] }],
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return anon.restore(text);
      }
    } catch { /* fall through */ }
  }

  // Try Groq (anonymized, OpenAI-compatible)
  if (process.env.GROQ_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: scrubbedSystem },
            { role: "user", content: scrubbedUser },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return anon.restore(text);
      }
    } catch { /* fall through */ }
  }

  // Try Mistral (anonymized)
  if (process.env.MISTRAL_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.MISTRAL_MODEL || "mistral-small-latest",
          messages: [
            { role: "system", content: scrubbedSystem },
            { role: "user", content: scrubbedUser },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return anon.restore(text);
      }
    } catch { /* fall through */ }
  }

  return "Unable to generate report — no LLM provider available. Ensure Ollama is running or set an API key (OpenAI, Anthropic, Gemini, Groq, or Mistral).";
}

export async function POST(req: Request) {
  try {
    const { messages, reportType, timeRange } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const type = reportType || "daily";
    const range = timeRange || "today";

    const systemPrompt = `You are VaultAI's report generator. Create a concise, actionable ${type} digest report. Use markdown formatting with headers, bullet points, and bold for key items. Include sections for: Key Topics Discussed, Decisions Made, Action Items, and a Brief Summary. Keep it professional and scannable.`;

    const chatSummary = messages
      .filter((m: any) => m.role !== "error" && !m.pending)
      .map((m: any) => `[${m.role}] ${m.content}`)
      .join("\n")
      .slice(0, 10000); // Cap at 10k chars

    const userPrompt = `Generate a ${type} report for the time range: ${range}.\n\nChat history:\n${chatSummary}`;

    const report = await callLLM(systemPrompt, userPrompt);

    return NextResponse.json({
      report,
      generatedAt: new Date().toISOString(),
      reportType: type,
      timeRange: range,
      messageCount: messages.length,
    });
  } catch (error) {
    console.error("Report generation error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to generate report: " + (error as Error).message },
      { status: 500 }
    );
  }
}
