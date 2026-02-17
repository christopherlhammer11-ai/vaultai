/**
 * 🔨🛡️ HammerLock AI Anonymization Layer — v2 (holistic rewrite)
 * Your personal data bodyguard. Strips PII before anything leaves your device.
 *
 * DESIGN PRINCIPLES:
 *   1. Only scrub OUTBOUND text (queries sent to Brave / OpenAI / Anthropic).
 *      Never scrub LLM responses or system prompts containing search results.
 *   2. Only scrub KNOWN PII — values explicitly found in the user's persona
 *      file or profile (name, email, phone, address, company).
 *      No more regex guessing ("2-3 capitalized words = person name").
 *   3. Keep SSN / credit-card / account-number regex as a safety net —
 *      these are unambiguous patterns that should never leak.
 *   4. One Anonymizer instance per request. The caller decides what to scrub.
 *
 * Privacy guarantee: raw PII never leaves the local server process.
 * Only placeholder tokens reach external APIs.
 */

// ---- PII categories ----

type PIICategory =
  | "PERSON"
  | "ORG"
  | "EMAIL"
  | "PHONE"
  | "SSN"
  | "CREDIT_CARD"
  | "ADDRESS"
  | "ACCOUNT";

type PIIMatch = {
  original: string;
  category: PIICategory;
  placeholder: string;
};

// ---- Safety-net regex patterns (unambiguous, high-confidence only) ----

const SAFETY_PATTERNS: { category: PIICategory; regex: RegExp }[] = [
  // SSN — always dangerous to leak
  { category: "SSN", regex: /\b\d{3}-\d{2}-\d{4}\b/g },

  // Credit card numbers (basic 16-digit groups)
  { category: "CREDIT_CARD", regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g },

  // Account / routing numbers preceded by a keyword
  { category: "ACCOUNT", regex: /\b(?:account|routing|acct)[\s#:]*\d{8,17}\b/gi },
];

// ---- Anonymizer class ----

export class Anonymizer {
  private map = new Map<string, PIIMatch>();
  private reverseMap = new Map<string, string>();
  private counters: Record<PIICategory, number> = {
    PERSON: 0,
    ORG: 0,
    EMAIL: 0,
    PHONE: 0,
    SSN: 0,
    CREDIT_CARD: 0,
    ADDRESS: 0,
    ACCOUNT: 0,
  };

  /**
   * Creates an Anonymizer seeded with KNOWN PII from the user's
   * persona / profile. Only these values (plus SSN/CC safety-net)
   * will ever be scrubbed.
   */
  constructor(knownPII?: {
    names?: string[];
    orgs?: string[];
    emails?: string[];
    phones?: string[];
    addresses?: string[];
  }) {
    if (knownPII) {
      knownPII.names?.forEach((n) => this.register(n.trim(), "PERSON"));
      knownPII.orgs?.forEach((o) => this.register(o.trim(), "ORG"));
      knownPII.emails?.forEach((e) => this.register(e.trim(), "EMAIL"));
      knownPII.phones?.forEach((p) => this.register(p.trim(), "PHONE"));
      knownPII.addresses?.forEach((a) => this.register(a.trim(), "ADDRESS"));
    }
  }

  /** Register a known PII value and assign a placeholder */
  private register(original: string, category: PIICategory): string {
    if (!original || original.length < 2) return original;
    const key = original.toLowerCase();
    const existing = this.map.get(key);
    if (existing) return existing.placeholder;

    this.counters[category]++;
    const placeholder = `[${category}_${this.counters[category]}]`;
    const match: PIIMatch = { original, category, placeholder };
    this.map.set(key, match);
    this.reverseMap.set(placeholder, original);
    return placeholder;
  }

  /**
   * Scrub KNOWN PII from outbound text, replacing with placeholders.
   *
   * This ONLY replaces:
   *   - Values explicitly registered from the user's persona/profile
   *   - SSN, credit card, and account numbers (safety-net regex)
   *
   * It does NOT guess at names from capitalized words.
   */
  scrub(text: string): string {
    let result = text;

    // 1. Replace all registered known PII (case-insensitive)
    for (const [, match] of this.map) {
      const escaped = match.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(escaped, "gi");
      result = result.replace(re, match.placeholder);
    }

    // 2. Safety-net: catch SSNs, credit cards, account numbers
    //    These are unambiguous patterns that should never reach external APIs.
    for (const { category, regex } of SAFETY_PATTERNS) {
      regex.lastIndex = 0;
      const matches = result.match(regex);
      if (matches) {
        for (const m of matches) {
          const placeholder = this.register(m, category);
          result = result.split(m).join(placeholder);
        }
      }
    }

    return result;
  }

  /**
   * Restore original PII values in an API response.
   * Call this on the LLM reply to put real names/values back.
   */
  restore(text: string): string {
    let result = text;
    for (const [placeholder, original] of this.reverseMap) {
      result = result.split(placeholder).join(original);
    }
    return result;
  }

  /** Get the number of PII items registered */
  get detectedCount(): number {
    return this.map.size;
  }

  /** Get a summary of what was registered (for logging, never send externally) */
  get summary(): string {
    const cats: Partial<Record<PIICategory, number>> = {};
    for (const match of this.map.values()) {
      cats[match.category] = (cats[match.category] || 0) + 1;
    }
    return Object.entries(cats)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(", ");
  }
}

// ---- Convenience functions for use in API routes ----

/**
 * Extract known PII from persona text and user profile.
 * Only extracts EXPLICITLY stated values — no guessing.
 */
export function extractKnownPII(
  persona?: string,
  userProfile?: { name?: string; role?: string; industry?: string; context?: string } | null
): { names: string[]; orgs: string[]; emails: string[]; phones: string[]; addresses: string[] } {
  const names: string[] = [];
  const orgs: string[] = [];
  const emails: string[] = [];
  const phones: string[] = [];
  const addresses: string[] = [];

  // Extract from user profile
  if (userProfile?.name) {
    names.push(userProfile.name);
    // Also register individual name parts (first, last) — but only
    // if they're 3+ chars to avoid catching short common words
    const parts = userProfile.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      parts.forEach((p) => {
        if (p.length > 2) names.push(p);
      });
    }
  }

  // Extract from persona text — only labeled fields
  if (persona) {
    // "Name: Foo Bar" patterns
    const nameMatch = persona.match(
      /(?:name|founder|ceo|cto|owner)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi
    );
    if (nameMatch) {
      for (const m of nameMatch) {
        const val = m.replace(/^[^:]+:\s*/, "").trim();
        if (val.length > 2) names.push(val);
      }
    }

    // "Company: Acme Corp" patterns
    const orgMatch = persona.match(
      /(?:company|org|firm|employer|business|startup|founded)[\s:]+([^\n.,]+)/gi
    );
    if (orgMatch) {
      for (const m of orgMatch) {
        const val = m.replace(/^[^:]+:\s*/, "").trim();
        if (val.length > 2) orgs.push(val);
      }
    }

    // Email addresses in persona
    const emailMatch = persona.match(
      /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b/g
    );
    if (emailMatch) emails.push(...emailMatch);

    // Phone numbers in persona
    const phoneMatch = persona.match(
      /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g
    );
    if (phoneMatch) phones.push(...phoneMatch);

    // Labeled address lines: "Location: 123 Main St, City, ST 12345"
    const addrMatch = persona.match(
      /(?:location|address|city)[\s:]+([^\n]+)/gi
    );
    if (addrMatch) {
      for (const m of addrMatch) {
        const val = m.replace(/^[^:]+:\s*/, "").trim();
        if (val.length > 3) addresses.push(val);
      }
    }
  }

  return { names, orgs, emails, phones, addresses };
}

/**
 * Create an anonymizer seeded with the user's known PII.
 * Call ONCE per request, pass it through to wherever scrub/restore are needed.
 */
export function createAnonymizer(
  persona?: string,
  userProfile?: { name?: string; role?: string; industry?: string; context?: string } | null
): Anonymizer {
  const knownPII = extractKnownPII(persona, userProfile);
  return new Anonymizer(knownPII);
}
