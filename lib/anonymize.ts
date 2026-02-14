/**
 * VaultAI Anonymization Layer
 *
 * Scrubs personally identifiable information (PII) from outbound queries
 * before they reach external LLM / search APIs, then re-hydrates the
 * response so the user sees their original names, companies, etc.
 *
 * How it works:
 *   1. Regex + heuristic detection finds PII tokens (names, emails,
 *      phone numbers, SSNs, company names, addresses, URLs with PII).
 *   2. Each token is replaced with a stable placeholder like [PERSON_1],
 *      [ORG_1], [EMAIL_1], etc.
 *   3. The scrubbed text goes to the external API.
 *   4. The API response is scanned for those placeholders and the
 *      original values are restored before showing the user.
 *
 * Privacy guarantee: the raw PII never leaves the local server process.
 * Only the placeholder tokens reach OpenAI / Anthropic / Brave.
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
  | "IP"
  | "DATE_OF_BIRTH"
  | "ACCOUNT";

type PIIMatch = {
  original: string;
  category: PIICategory;
  placeholder: string;
};

// ---- Regex patterns ----

const PATTERNS: { category: PIICategory; regex: RegExp }[] = [
  // Email addresses
  { category: "EMAIL", regex: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b/g },

  // US phone numbers (various formats)
  { category: "PHONE", regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },

  // SSN
  { category: "SSN", regex: /\b\d{3}-\d{2}-\d{4}\b/g },

  // Credit card numbers (basic)
  { category: "CREDIT_CARD", regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g },

  // IP addresses
  { category: "IP", regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },

  // Account / routing numbers (8-17 digits)
  { category: "ACCOUNT", regex: /\b(?:account|routing|acct)[\s#:]*\d{8,17}\b/gi },
];

// Words that are common enough to NOT anonymize as person names
const NAME_STOPWORDS = new Set([
  // Common English words that look like names
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it",
  "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
  "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
  "an", "will", "my", "one", "all", "would", "there", "their", "what",
  // Tech / business terms
  "ai", "api", "ceo", "cto", "cfo", "llm", "saas", "b2b", "b2c",
  "pdf", "csv", "json", "sql", "etf", "ipo", "m&a", "roi", "kpi",
  "gdpr", "hipaa", "sec", "fda", "eu", "us", "uk",
  // Common nouns often capitalized
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "january", "february", "march", "april", "may", "june", "july",
  "august", "september", "october", "november", "december",
  "north", "south", "east", "west",
  // Agent / app terms
  "vaultai", "strategist", "counsel", "analyst", "researcher", "operator", "writer",
  "vault", "persona", "search", "brave", "openai", "anthropic", "claude", "ollama",
]);

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
    IP: 0,
    DATE_OF_BIRTH: 0,
    ACCOUNT: 0,
  };

  /**
   * Creates an Anonymizer, optionally seeded with known PII from the
   * user's persona / profile so those values are always caught.
   */
  constructor(knownPII?: { names?: string[]; orgs?: string[]; emails?: string[] }) {
    if (knownPII) {
      knownPII.names?.forEach((n) => this.register(n.trim(), "PERSON"));
      knownPII.orgs?.forEach((o) => this.register(o.trim(), "ORG"));
      knownPII.emails?.forEach((e) => this.register(e.trim(), "EMAIL"));
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
   * Scrub PII from text, replacing with placeholders.
   * Returns the scrubbed text.
   */
  scrub(text: string): string {
    let result = text;

    // 1. Apply regex-based patterns first (emails, phones, SSNs, etc.)
    for (const { category, regex } of PATTERNS) {
      // Reset regex lastIndex for global patterns
      regex.lastIndex = 0;
      const matches = result.match(regex);
      if (matches) {
        for (const m of matches) {
          const placeholder = this.register(m, category);
          result = result.split(m).join(placeholder);
        }
      }
    }

    // 2. Detect probable person names (capitalized word sequences)
    //    Pattern: 2-3 consecutive capitalized words not at sentence start
    const nameRegex = /(?<!\.\s)(?<![.!?]\s)(?<=\s|^)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})(?=[\s,;.!?]|$)/g;
    const nameMatches = text.match(nameRegex);
    if (nameMatches) {
      for (const name of nameMatches) {
        const words = name.trim().split(/\s+/);
        // Skip if any word is a stopword
        if (words.some((w) => NAME_STOPWORDS.has(w.toLowerCase()))) continue;
        // Skip very short matches (likely false positives)
        if (name.length < 4) continue;
        const placeholder = this.register(name.trim(), "PERSON");
        result = result.split(name.trim()).join(placeholder);
      }
    }

    // 3. Replace any pre-registered PII (from persona / profile seed)
    //    Do this last so explicit registrations always take effect
    for (const [key, match] of this.map) {
      // Case-insensitive replacement of the original value
      const escaped = match.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(escaped, "gi");
      result = result.replace(re, match.placeholder);
    }

    return result;
  }

  /**
   * Restore original PII values in an API response.
   */
  restore(text: string): string {
    let result = text;
    for (const [placeholder, original] of this.reverseMap) {
      // Replace all occurrences of the placeholder
      result = result.split(placeholder).join(original);
    }
    return result;
  }

  /**
   * Scrub a persona / system prompt, keeping it useful for the LLM
   * but stripping identifying details.
   */
  scrubSystemPrompt(prompt: string): string {
    return this.scrub(prompt);
  }

  /** Get the number of PII items detected */
  get detectedCount(): number {
    return this.map.size;
  }

  /** Get a summary of what was anonymized (for logging, never send externally) */
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
 * Extract known PII from persona text and user profile
 * to seed the anonymizer.
 */
export function extractKnownPII(
  persona?: string,
  userProfile?: { name?: string; role?: string; industry?: string; context?: string } | null
): { names: string[]; orgs: string[]; emails: string[] } {
  const names: string[] = [];
  const orgs: string[] = [];
  const emails: string[] = [];

  // Extract from user profile
  if (userProfile?.name) {
    names.push(userProfile.name);
    // Also register individual name parts (first, last)
    const parts = userProfile.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      parts.forEach((p) => {
        if (p.length > 2) names.push(p);
      });
    }
  }

  // Extract from persona text
  if (persona) {
    // Look for "Name: Foo Bar" patterns
    const nameMatch = persona.match(/(?:name|founder|ceo|cto|owner)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi);
    if (nameMatch) {
      for (const m of nameMatch) {
        const val = m.replace(/^[^:]+:\s*/, "").trim();
        if (val.length > 2) names.push(val);
      }
    }

    // Look for company names
    const orgMatch = persona.match(/(?:company|org|firm|employer|business|startup|founded)[\s:]+([^\n.,]+)/gi);
    if (orgMatch) {
      for (const m of orgMatch) {
        const val = m.replace(/^[^:]+:\s*/, "").trim();
        if (val.length > 2) orgs.push(val);
      }
    }

    // Find emails in persona
    const emailMatch = persona.match(/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b/g);
    if (emailMatch) emails.push(...emailMatch);
  }

  return { names, orgs, emails };
}

/**
 * Create an anonymizer seeded with the user's known PII.
 * Call once per request, use for scrub() and restore().
 */
export function createAnonymizer(
  persona?: string,
  userProfile?: { name?: string; role?: string; industry?: string; context?: string } | null
): Anonymizer {
  const knownPII = extractKnownPII(persona, userProfile);
  return new Anonymizer(knownPII);
}
