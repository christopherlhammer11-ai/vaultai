import path from "path";
import os from "os";
import fs from "fs/promises";

const CREDITS_PATH = path.join(os.homedir(), ".hammerlock", "credits.json");

// Premium users start with 500 compute units
// Roughly: 1 unit = 1 simple chat, search costs 2, reports 3
// Internally each unit maps to ~$0.02 of actual compute (cost-plus for top-up packs)
const DEFAULT_UNITS = 500;

const COST_MAP: Record<string, number> = {
  chat: 1,
  search: 2,
  transcribe: 2,
  report: 3,
  pdf: 2,
};

type CreditData = {
  totalUnits: number;
  usedUnits: number;
  requestCount: number;
  createdAt: string;
  lastUsedAt: string;
};

async function readCredits(): Promise<CreditData> {
  try {
    const raw = await fs.readFile(CREDITS_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    const initial: CreditData = {
      totalUnits: DEFAULT_UNITS,
      usedUnits: 0,
      requestCount: 0,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    };
    await fs.mkdir(path.dirname(CREDITS_PATH), { recursive: true });
    await fs.writeFile(CREDITS_PATH, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
}

async function writeCredits(data: CreditData): Promise<void> {
  await fs.mkdir(path.dirname(CREDITS_PATH), { recursive: true });
  await fs.writeFile(CREDITS_PATH, JSON.stringify(data, null, 2), "utf8");
}

/** Remaining units. */
export async function getRemainingUnits(): Promise<number> {
  const data = await readCredits();
  return Math.max(0, data.totalUnits - data.usedUnits);
}

/** Full credit info for the client. */
export async function getCreditInfo(): Promise<{
  totalUnits: number;
  usedUnits: number;
  remainingUnits: number;
  requestCount: number;
}> {
  const data = await readCredits();
  return {
    totalUnits: data.totalUnits,
    usedUnits: data.usedUnits,
    remainingUnits: Math.max(0, data.totalUnits - data.usedUnits),
    requestCount: data.requestCount,
  };
}

/**
 * Check if there's enough credit for a request type.
 * Returns true if the user has their own API key (unlimited).
 */
export async function hasCredit(requestType: string = "chat"): Promise<boolean> {
  const hasUserKey = !!(process.env.HAMMERLOCK_USER_OPENAI_KEY || process.env.HAMMERLOCK_USER_ANTHROPIC_KEY);
  if (hasUserKey) return true;

  const cost = COST_MAP[requestType] || COST_MAP.chat;
  const remaining = await getRemainingUnits();
  return remaining >= cost;
}

/**
 * Deduct units for a completed request.
 * Skips deduction if the user is using their own key.
 */
export async function deductCredit(requestType: string = "chat"): Promise<void> {
  const hasUserKey = !!(process.env.HAMMERLOCK_USER_OPENAI_KEY || process.env.HAMMERLOCK_USER_ANTHROPIC_KEY);
  if (hasUserKey) return;

  const cost = COST_MAP[requestType] || COST_MAP.chat;
  const data = await readCredits();
  data.usedUnits += cost;
  data.requestCount++;
  data.lastUsedAt = new Date().toISOString();
  await writeCredits(data);
}

/**
 * Add more units (for when user purchases a top-up pack).
 */
export async function addUnits(units: number): Promise<void> {
  const data = await readCredits();
  data.totalUnits += units;
  await writeCredits(data);
}
