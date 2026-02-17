import { NextResponse } from "next/server";
import { getCreditInfo } from "@/lib/compute-credits";

/**
 * GET /api/credits
 * Returns compute unit balance for premium desktop users.
 * Units are only tracked when using the bundled API key.
 */
export async function GET() {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) {
    return NextResponse.json({ credits: null, message: "Credits not applicable for web" });
  }

  try {
    const info = await getCreditInfo();
    const hasUserKey = !!(process.env.HAMMERLOCK_USER_OPENAI_KEY || process.env.HAMMERLOCK_USER_ANTHROPIC_KEY);

    return NextResponse.json({
      ...info,
      usingOwnKey: hasUserKey,
    });
  } catch (error) {
    console.error("[credits] Error:", (error as Error).message);
    return NextResponse.json({ error: "Failed to read credits" }, { status: 500 });
  }
}
