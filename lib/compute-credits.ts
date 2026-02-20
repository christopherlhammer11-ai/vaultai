import path from "path";
import os from "os";
import fs from "fs/promises";

const CREDITS_PATH = path.join(os.homedir(), ".hammerlock", "credits.json");

// Monthly allocation for Pro subscribers (bundled with $29/mo plan)
// ~$8-10 of actual compute per month at cost
const DEFAULT_MONTHLY_ALLOCATION = 1000;

// Legacy: one-time premium users started with 500 units
const LEGACY_DEFAULT_UNITS = 500;

const COST_MAP: Record<string, number> = {
  chat: 1,            // lightweight models: gpt-4o-mini, gemini-flash, groq, mistral-small, deepseek
  chat_premium: 3,    // heavy models: gpt-4o, claude-sonnet, gemini-pro
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
  // Monthly billing period tracking
  periodStart: string;        // ISO — when this billing period started
  periodEnd: string;          // ISO — when credits expire/reset
  monthlyAllocation: number;  // base monthly units (1000 for Pro)
  boosterUnits: number;       // extra units from add-on packs (Booster: 1500, Power: 5000)
};

/** Advance period by 30 days from a given start date. */
function advancePeriod(fromDate: string): { periodStart: string; periodEnd: string } {
  const start = new Date(fromDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  return { periodStart: start.toISOString(), periodEnd: end.toISOString() };
}

/** Migrate legacy credit data (pre-period-tracking) to new format. */
function migrateLegacy(data: Partial<CreditData>): CreditData {
  const now = new Date().toISOString();
  const createdAt = data.createdAt || now;

  // If periodEnd is missing, this is legacy data — initialize period from createdAt
  if (!data.periodEnd) {
    const { periodStart, periodEnd } = advancePeriod(createdAt);
    return {
      totalUnits: data.totalUnits ?? LEGACY_DEFAULT_UNITS,
      usedUnits: data.usedUnits ?? 0,
      requestCount: data.requestCount ?? 0,
      createdAt,
      lastUsedAt: data.lastUsedAt || now,
      periodStart,
      periodEnd,
      monthlyAllocation: data.monthlyAllocation ?? DEFAULT_MONTHLY_ALLOCATION,
      boosterUnits: data.boosterUnits ?? 0,
    };
  }

  return {
    totalUnits: data.totalUnits ?? DEFAULT_MONTHLY_ALLOCATION,
    usedUnits: data.usedUnits ?? 0,
    requestCount: data.requestCount ?? 0,
    createdAt,
    lastUsedAt: data.lastUsedAt || now,
    periodStart: data.periodStart || createdAt,
    periodEnd: data.periodEnd,
    monthlyAllocation: data.monthlyAllocation ?? DEFAULT_MONTHLY_ALLOCATION,
    boosterUnits: data.boosterUnits ?? 0,
  };
}

async function readCredits(): Promise<CreditData> {
  try {
    const raw = await fs.readFile(CREDITS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return migrateLegacy(parsed);
  } catch {
    const now = new Date().toISOString();
    const { periodStart, periodEnd } = advancePeriod(now);
    const initial: CreditData = {
      totalUnits: DEFAULT_MONTHLY_ALLOCATION,
      usedUnits: 0,
      requestCount: 0,
      createdAt: now,
      lastUsedAt: now,
      periodStart,
      periodEnd,
      monthlyAllocation: DEFAULT_MONTHLY_ALLOCATION,
      boosterUnits: 0,
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

/**
 * Check if the billing period has expired and reset credits if so.
 * Called automatically before any credit check.
 */
async function checkAndResetPeriod(): Promise<CreditData> {
  const data = await readCredits();
  const now = Date.now();
  const periodEnd = new Date(data.periodEnd).getTime();

  if (now >= periodEnd) {
    // Period expired — reset credits and advance to new period
    const newPeriod = advancePeriod(new Date().toISOString());
    data.usedUnits = 0;
    data.requestCount = 0;
    data.totalUnits = data.monthlyAllocation + data.boosterUnits;
    data.periodStart = newPeriod.periodStart;
    data.periodEnd = newPeriod.periodEnd;
    await writeCredits(data);
  }

  return data;
}

/** Remaining units. */
export async function getRemainingUnits(): Promise<number> {
  const data = await checkAndResetPeriod();
  return Math.max(0, data.totalUnits - data.usedUnits);
}

/** Full credit info for the client. */
export async function getCreditInfo(): Promise<{
  totalUnits: number;
  usedUnits: number;
  remainingUnits: number;
  requestCount: number;
  periodEnd: string;
  monthlyAllocation: number;
  boosterUnits: number;
}> {
  const data = await checkAndResetPeriod();
  return {
    totalUnits: data.totalUnits,
    usedUnits: data.usedUnits,
    remainingUnits: Math.max(0, data.totalUnits - data.usedUnits),
    requestCount: data.requestCount,
    periodEnd: data.periodEnd,
    monthlyAllocation: data.monthlyAllocation,
    boosterUnits: data.boosterUnits,
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
  const data = await checkAndResetPeriod();
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

/**
 * Set the monthly allocation (called when subscription tier changes).
 */
export async function setMonthlyAllocation(units: number): Promise<void> {
  const data = await readCredits();
  data.monthlyAllocation = units;
  data.totalUnits = units + data.boosterUnits;
  await writeCredits(data);
}

/**
 * Set booster units (called when booster/power pack subscription changes).
 * Pass 0 to remove booster.
 */
export async function setBoosterUnits(units: number): Promise<void> {
  const data = await readCredits();
  data.boosterUnits = units;
  data.totalUnits = data.monthlyAllocation + units;
  await writeCredits(data);
}

export { COST_MAP, DEFAULT_MONTHLY_ALLOCATION };
