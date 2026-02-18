/**
 * HammerLock AI — Server-side License Tier Enforcement
 *
 * Reads the cached license from ~/.hammerlock/license.json
 * and checks if the user's tier is sufficient for a given API route.
 *
 * Only enforced on desktop (localhost). On Vercel, client-side checks apply.
 */

import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { decryptFromFile } from "./server-crypto";

const LICENSE_CACHE_PATH = path.join(os.homedir(), ".hammerlock", "license.json");
const DEVICE_ID_PATH = path.join(os.homedir(), ".hammerlock", "device-id");

const TIER_RANK: Record<string, number> = {
  free: 0,
  core: 1,
  pro: 2,
  teams: 3,
  enterprise: 4,
};

/** Maps API routes to their minimum required tier.
 * Accepts both full paths (/api/transcribe) and short names (transcribe).
 */
const ROUTE_TIER_MAP: Record<string, string> = {
  "/api/transcribe": "pro",
  "transcribe": "pro",
  "/api/tts": "pro",
  "tts": "pro",
  "/api/pdf-parse": "pro",
  "pdf-parse": "pro",
  "/api/report": "pro",
  "report": "pro",
  "/api/share": "core",
  "share": "core",
};

/**
 * Derive an encryption key from the device ID for license cache encryption.
 * This is NOT meant to be unbreakable — it prevents casual inspection.
 * Real enforcement is server-side validation.
 */
function deriveLicenseEncryptionKey(deviceId: string): Buffer {
  const salt = Buffer.from("hammerlock-license-salt-v1", "utf8");
  return crypto.pbkdf2Sync(deviceId, salt, 50_000, 32, "sha256");
}

/**
 * Read and decrypt the local cached license.
 * Returns null if no cache exists or decryption fails.
 */
export async function readCachedLicense(): Promise<{
  licenseKey: string;
  tier: string;
  billingType: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  activatedAt: string;
  validatedAt: string;
  deviceId: string;
} | null> {
  try {
    const deviceId = (await fs.readFile(DEVICE_ID_PATH, "utf8")).trim();
    if (!deviceId) return null;

    const raw = await fs.readFile(LICENSE_CACHE_PATH, "utf8");
    const key = deriveLicenseEncryptionKey(deviceId);
    const decrypted = decryptFromFile(raw, key);
    if (!decrypted) return null;

    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

/**
 * Encrypt and write the license cache to disk.
 */
export async function writeCachedLicense(data: {
  licenseKey: string;
  tier: string;
  billingType: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  activatedAt: string;
  validatedAt: string;
  deviceId: string;
}): Promise<void> {
  const { encryptForFile } = await import("./server-crypto");
  const deviceId = (await fs.readFile(DEVICE_ID_PATH, "utf8")).trim();
  const key = deriveLicenseEncryptionKey(deviceId);
  const encrypted = encryptForFile(JSON.stringify(data), key);
  await fs.mkdir(path.dirname(LICENSE_CACHE_PATH), { recursive: true });
  await fs.writeFile(LICENSE_CACHE_PATH, encrypted, "utf8");
}

/**
 * Get the local cached license tier. Returns "free" if no valid cache.
 */
export async function getLocalLicenseTier(): Promise<string> {
  try {
    const cached = await readCachedLicense();
    if (!cached) return "free";

    // Check if cache is still within acceptable age (14 days = 7-day interval + 7-day grace)
    const validatedAt = new Date(cached.validatedAt).getTime();
    const maxAge = 14 * 24 * 60 * 60 * 1000;
    if (Date.now() - validatedAt > maxAge) {
      return "free";
    }

    return cached.tier || "free";
  } catch {
    return "free";
  }
}

/**
 * Check if a request to the given route is allowed based on the local license tier.
 * Only enforces on desktop (localhost). On Vercel, returns allowed: true.
 */
export async function requireTier(
  route: string
): Promise<{
  allowed: boolean;
  tier: string;
  required: string;
  requiredTier: string;
  reason: string | null;
}> {
  const required = ROUTE_TIER_MAP[route];
  if (!required) return { allowed: true, tier: "any", required: "none", requiredTier: "none", reason: null };

  // On Vercel, skip server-side enforcement (no local license cache)
  if (process.env.VERCEL) {
    return { allowed: true, tier: "web", required, requiredTier: required, reason: null };
  }

  const tier = await getLocalLicenseTier();
  const tierRank = TIER_RANK[tier] ?? 0;
  const requiredRank = TIER_RANK[required] ?? 0;
  const allowed = tierRank >= requiredRank;

  return {
    allowed,
    tier,
    required,
    requiredTier: required,
    reason: allowed ? null : `This feature requires the ${required.charAt(0).toUpperCase() + required.slice(1)} plan or higher. Your current plan: ${tier}.`,
  };
}
