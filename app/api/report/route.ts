import { NextResponse } from "next/server";

/**
 * POST /api/report
 * Generates a scheduled report summary from provided chat history.
 * The client sends its encrypted chat history (already decrypted client-side)
 * and this endpoint asks the LLM to create a digest.
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3";

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  // Try Ollama first
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
    /* fall through */
  }

  // Try OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      const text = res.choices?.[0]?.message?.content?.trim();
      if (text) return text;
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
