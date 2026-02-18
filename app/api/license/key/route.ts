/**
 * GET /api/license/key?session_id=cs_xxx
 *
 * Retrieves the generated license key for a given Stripe checkout session.
 * Called by the success page after purchase.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const license = await prisma.license.findUnique({
      where: { stripeSessionId: sessionId },
      select: { key: true, tier: true },
    });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    return NextResponse.json({ licenseKey: license.key, tier: license.tier });
  } catch (err) {
    console.error("[license/key] Error:", (err as Error).message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
