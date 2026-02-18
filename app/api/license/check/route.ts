/**
 * GET /api/license/check
 *
 * Desktop startup license orchestration endpoint.
 * Called by the Electron app on every launch to determine the user's tier.
 *
 * Flow:
 * 1. Read cached license from ~/.hammerlock/license.json
 * 2. If no cache → { needsActivation: true }
 * 3. If cache is fresh (<7 days) → return cached tier
 * 4. If stale → re-validate against hammerlockai.com
 * 5. If offline + within grace (7 more days) → return cached tier
 * 6. If past grace → downgrade to free
 */

import { NextResponse } from "next/server";
import { readCachedLicense, writeCachedLicense } from "@/lib/license-guard";

const VALIDATION_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 additional days
const REMOTE_API = "https://hammerlockai.com";

export async function GET() {
  // Only runs on desktop (localhost)
  if (process.env.VERCEL) {
    return NextResponse.json(
      { error: "Not applicable on web" },
      { status: 400 }
    );
  }

  try {
    // 1. Read cached license
    const cached = await readCachedLicense();
    if (!cached) {
      return NextResponse.json({ needsActivation: true, tier: "free" });
    }

    // 2. Check if re-validation is needed
    const lastValidated = new Date(cached.validatedAt).getTime();
    const now = Date.now();
    const needsRevalidation = now - lastValidated > VALIDATION_INTERVAL_MS;

    // For one-time purchases (Core), skip revalidation — license never expires
    if (cached.billingType === "onetime" && !needsRevalidation) {
      return NextResponse.json({
        tier: cached.tier,
        billingType: cached.billingType,
        currentPeriodEnd: null,
        cached: true,
      });
    }

    if (!needsRevalidation) {
      // Cache is fresh
      return NextResponse.json({
        tier: cached.tier,
        billingType: cached.billingType,
        currentPeriodEnd: cached.currentPeriodEnd,
        cancelAtPeriodEnd: cached.cancelAtPeriodEnd,
        cached: true,
      });
    }

    // 3. Attempt remote re-validation
    try {
      const res = await fetch(`${REMOTE_API}/api/license/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseKey: cached.licenseKey,
          deviceId: cached.deviceId,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        const data = await res.json();
        // Update cache
        const updated = {
          ...cached,
          tier: data.tier,
          billingType: data.billingType,
          currentPeriodEnd: data.currentPeriodEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          validatedAt: new Date().toISOString(),
        };
        await writeCachedLicense(updated);
        return NextResponse.json({
          tier: data.tier,
          billingType: data.billingType,
          currentPeriodEnd: data.currentPeriodEnd,
          revalidated: true,
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        // License revoked or expired server-side
        if (res.status === 403 || res.status === 404) {
          const expiredCache = {
            ...cached,
            tier: "free",
            validatedAt: new Date().toISOString(),
          };
          await writeCachedLicense(expiredCache);
          return NextResponse.json({
            tier: "free",
            expired: true,
            reason: errData.error,
          });
        }
        throw new Error("Validation request failed");
      }
    } catch {
      // 4. Offline — check grace period
      const gracePeriodEnd =
        lastValidated + VALIDATION_INTERVAL_MS + GRACE_PERIOD_MS;
      if (now < gracePeriodEnd) {
        return NextResponse.json({
          tier: cached.tier,
          billingType: cached.billingType,
          cached: true,
          graceMode: true,
          graceExpiresAt: new Date(gracePeriodEnd).toISOString(),
        });
      } else {
        // Past grace period — downgrade
        return NextResponse.json({
          tier: "free",
          expired: true,
          reason: "Offline validation period expired",
        });
      }
    }
  } catch (err) {
    console.error("[license/check] Error:", (err as Error).message);
    return NextResponse.json({ needsActivation: true, tier: "free" });
  }
}
