/**
 * Server-side file encryption for HammerLock AI.
 *
 * Encrypts/decrypts files at rest in ~/.hammerlock/ using AES-256-GCM.
 * The encryption key is derived from the user's vault password via PBKDF2
 * and is held in memory only while the vault is unlocked.
 *
 * File format: base64( salt[16] + iv[12] + ciphertext + authTag[16] )
 * The salt is stored per-file so each file can be independently decrypted.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // bytes
const IV_LENGTH = 12; // bytes
const SALT_LENGTH = 16; // bytes
const PBKDF2_ITERATIONS = 100_000;
const ENCRYPTED_PREFIX = "HAMMERLOCK_ENC:";
const LEGACY_PREFIX = "VAULTAI_ENC:"; // Backward compat for pre-rebrand data

// In-memory session key — set when vault unlocks, cleared on lock
let sessionKey: Buffer | null = null;

/**
 * Set the session encryption key (called when user unlocks vault).
 * The key is a raw 32-byte buffer derived from the vault password.
 */
export function setServerSessionKey(keyHex: string | null) {
  if (!keyHex) {
    sessionKey = null;
    return;
  }
  sessionKey = Buffer.from(keyHex, "hex");
  if (sessionKey.length !== KEY_LENGTH) {
    throw new Error(`Invalid key length: expected ${KEY_LENGTH}, got ${sessionKey.length}`);
  }
}

/** Check if server has an active session key */
export function hasServerSessionKey(): boolean {
  return sessionKey !== null;
}

/** Clear the session key (called on vault lock) */
export function clearServerSessionKey() {
  sessionKey = null;
}

/**
 * Encrypt a plaintext string for file storage.
 * Returns a string prefixed with HAMMERLOCK_ENC: followed by base64 data.
 */
export function encryptForFile(plaintext: string, key?: Buffer): string {
  const k = key ?? sessionKey;
  if (!k) throw new Error("No encryption key available");

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, k, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Format: iv + ciphertext + authTag
  const combined = Buffer.concat([iv, encrypted, authTag]);
  return ENCRYPTED_PREFIX + combined.toString("base64");
}

/**
 * Decrypt a HAMMERLOCK_ENC: prefixed string.
 * Returns the plaintext, or null if decryption fails.
 */
export function decryptFromFile(data: string, key?: Buffer): string | null {
  const k = key ?? sessionKey;
  if (!k) return null;

  // Determine which prefix is used (support legacy VAULTAI_ENC: from pre-rebrand)
  let prefix: string;
  if (data.startsWith(ENCRYPTED_PREFIX)) {
    prefix = ENCRYPTED_PREFIX;
  } else if (data.startsWith(LEGACY_PREFIX)) {
    prefix = LEGACY_PREFIX;
  } else {
    // Not encrypted — return as-is (migration path for existing plaintext files)
    return data;
  }

  try {
    const raw = Buffer.from(data.slice(prefix.length), "base64");
    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(raw.length - 16);
    const ciphertext = raw.subarray(IV_LENGTH, raw.length - 16);

    const decipher = crypto.createDecipheriv(ALGORITHM, k, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (err) {
    console.error("[server-crypto] Decryption failed:", (err as Error).message);
    return null;
  }
}

/**
 * Check if a string is encrypted (has the HAMMERLOCK_ENC: or legacy VAULTAI_ENC: prefix).
 */
export function isEncrypted(data: string): boolean {
  return data.startsWith(ENCRYPTED_PREFIX) || data.startsWith(LEGACY_PREFIX);
}

/**
 * Derive a 32-byte key from a password using PBKDF2.
 * Used on the server side when the client sends the vault password.
 */
export function deriveServerKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");
}
