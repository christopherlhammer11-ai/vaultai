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

  return "Unable to generate report — no LLM provider available. Ensure Ollama is running or set OPENAI_API_KEY.";
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
