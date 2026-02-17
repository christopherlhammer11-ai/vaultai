import { NextResponse } from "next/server";

export async function GET() {
  // Check if at least one cloud LLM provider is configured (env vars)
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  // Check Ollama availability (local only — skipped in serverless/cloud)
  let ollamaUp = false;
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (!isServerless) {
    const ollamaBase = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    try {
      const ollamaRes = await fetch(`${ollamaBase}/api/tags`, { signal: AbortSignal.timeout(3000) });
      ollamaUp = ollamaRes.ok;
    } catch {
      // Ollama not running
    }
  }

  // Check OpenClaw gateway (local only — CLI doesn't exist on serverless)
  let gatewayUp = false;
  if (!isServerless) {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    try {
      await execAsync("openclaw --profile hammerlock health --json 2>/dev/null", {
        timeout: 5000,
      });
      gatewayUp = true;
    } catch {
      // Gateway not available
    }
  }

  const hasLLM = hasOpenAI || hasAnthropic || ollamaUp;

  return NextResponse.json({
    status: hasLLM || gatewayUp ? "ready" : "no_provider",
    gateway: gatewayUp ? "connected" : "offline",
    providers: {
      ollama: ollamaUp,
      openai: hasOpenAI,
      anthropic: hasAnthropic,
    },
  });
}
