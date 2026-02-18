/**
 * HammerLock AI — License Key Generation & Validation
 *
 * Format: HL-XXXX-XXXX-XXXX-XXXX
 * Uses a 29-character alphabet (no ambiguous 0/O, 1/I/L).
 */

import crypto from "crypto";

// Removed: 0, O, 1, I, L to avoid visual ambiguity
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 29 chars

/**
 * Generate a cryptographically random license key.
 * Format: HL-XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(): string {
  const groups: string[] = [];
  for (let g = 0; g < 4; g++) {
    let group = "";
    const bytes = crypto.randomBytes(4);
    for (let i = 0; i < 4; i++) {
      group += ALPHABET[bytes[i] % ALPHABET.length];
    }
    groups.push(group);
  }
  return `HL-${groups.join("-")}`;
}

/**
 * Validate that a string matches the license key format.
 */
export function isValidKeyFormat(key: string): boolean {
  return /^HL-[23456789A-HJ-NP-Z]{4}-[23456789A-HJ-NP-Z]{4}-[23456789A-HJ-NP-Z]{4}-[23456789A-HJ-NP-Z]{4}$/.test(
    key.toUpperCase()
  );
}
