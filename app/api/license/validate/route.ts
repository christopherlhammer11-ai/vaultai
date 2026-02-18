/**
 * POST /api/license/validate
 *
 * Re-validates a license key. Called by the desktop app periodically (every 7 days).
 * Checks: key exists, status active, device matches, subscription not expired.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidKeyFormat } from "@/lib/license-keys";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, deviceId } = await req.json();

    if (!licenseKey || !isValidKeyFormat(licenseKey)) {
      return NextResponse.json(
        { valid: false, error: "Invalid license key format" },
        { status: 400 }
      );
    }

    const license = await prisma.license.findUnique({
      where: { key: licenseKey.toUpperCase() },
    });

    if (!license) {
      return NextResponse.json(
        { valid: false, error: "License key not found" },
        { status: 404 }
      );
    }

    // Check device binding
    if (license.deviceId && deviceId && license.deviceId !== deviceId) {
      return NextResponse.json(
        { valid: false, error: "This license is activated on a different device" },
        { status: 403 }
      );
    }

    // Check status
    if (license.status !== "active") {
      return NextResponse.json(
        { valid: false, error: `License is ${license.status}`, tier: "free" },
        { status: 403 }
      );
    }

    // For subscriptions, check if period has ended
    if (license.billingType === "subscription" && license.currentPeriodEnd) {
      const now = new Date();
      if (now > license.currentPeriodEnd) {
        // Period ended — give a 3-day grace period for Stripe payment processing
        const gracePeriod = new Date(
          license.currentPeriodEnd.getTime() + 3 * 24 * 60 * 60 * 1000
        );
        if (now > gracePeriod) {
          return NextResponse.json(
            { valid: false, error: "Subscription expired", tier: "free" },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.json({
      valid: true,
      tier: license.tier,
      billingType: license.billingType,
      currentPeriodEnd: license.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: license.cancelAtPeriodEnd,
      validatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[license/validate] Error:", (err as Error).message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
