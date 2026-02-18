/**
 * POST /api/license/activate
 *
 * Binds a license key to a specific device. Called once when the user
 * enters their license key in the desktop app for the first time.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidKeyFormat } from "@/lib/license-keys";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, deviceId, deviceName } = await req.json();

    if (!licenseKey || !isValidKeyFormat(licenseKey)) {
      return NextResponse.json(
        { error: "Invalid license key format" },
        { status: 400 }
      );
    }

    if (!deviceId || typeof deviceId !== "string") {
      return NextResponse.json(
        { error: "Device ID required" },
        { status: 400 }
      );
    }

    const license = await prisma.license.findUnique({
      where: { key: licenseKey.toUpperCase() },
    });

    if (!license) {
      return NextResponse.json(
        { error: "License key not found" },
        { status: 404 }
      );
    }

    if (license.status !== "active") {
      return NextResponse.json(
        { error: `License is ${license.status}` },
        { status: 403 }
      );
    }

    // Already activated on a different device
    if (license.deviceId && license.deviceId !== deviceId) {
      return NextResponse.json(
        {
          error:
            "This license is already activated on another device. Contact support@hammerlockai.com to transfer.",
        },
        { status: 409 }
      );
    }

    // Already activated on this device — return success
    if (license.deviceId === deviceId) {
      return NextResponse.json({
        activated: true,
        tier: license.tier,
        billingType: license.billingType,
        currentPeriodEnd: license.currentPeriodEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: license.cancelAtPeriodEnd,
        activatedAt: license.activatedAt?.toISOString() ?? new Date().toISOString(),
      });
    }

    // Bind to this device
    const updated = await prisma.license.update({
      where: { key: licenseKey.toUpperCase() },
      data: {
        deviceId,
        deviceName: deviceName ?? null,
        activatedAt: new Date(),
      },
    });

    return NextResponse.json({
      activated: true,
      tier: updated.tier,
      billingType: updated.billingType,
      currentPeriodEnd: updated.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      activatedAt: updated.activatedAt?.toISOString(),
    });
  } catch (err) {
    console.error("[license/activate] Error:", (err as Error).message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
