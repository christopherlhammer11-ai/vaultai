/**
 * GET /api/license/cache — Read encrypted local license cache
 * POST /api/license/cache — Write encrypted local license cache
 *
 * The license cache is encrypted using a key derived from the device ID.
 * This runs on localhost only (desktop app).
 */

import { NextRequest, NextResponse } from "next/server";
import { readCachedLicense, writeCachedLicense } from "@/lib/license-guard";

export async function GET() {
  try {
    const cached = await readCachedLicense();
    if (!cached) {
      return NextResponse.json({ cached: false }, { status: 404 });
    }
    return NextResponse.json({ cached: true, ...cached });
  } catch (err) {
    console.error("[license/cache] Read error:", (err as Error).message);
    return NextResponse.json({ error: "Failed to read cache" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Validate required fields
    if (!data.licenseKey || !data.tier || !data.deviceId || !data.validatedAt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await writeCachedLicense({
      licenseKey: data.licenseKey,
      tier: data.tier,
      billingType: data.billingType ?? "onetime",
      currentPeriodEnd: data.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
      activatedAt: data.activatedAt ?? new Date().toISOString(),
      validatedAt: data.validatedAt,
      deviceId: data.deviceId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[license/cache] Write error:", (err as Error).message);
    return NextResponse.json({ error: "Failed to write cache" }, { status: 500 });
  }
}
