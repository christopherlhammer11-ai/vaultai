import { argon2id } from "@noble/hashes/argon2";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

let activeSalt: Uint8Array | null = null;

export const KDF_VERSIONS = {
  ARGON2ID_V1: "argon2id-v1",
  PBKDF2_V1: "pbkdf2-v1"
} as const;

export type KdfVersion = (typeof KDF_VERSIONS)[keyof typeof KDF_VERSIONS];

export const DEFAULT_KDF_VERSION: KdfVersion = KDF_VERSIONS.ARGON2ID_V1;
export const FALLBACK_KDF_VERSION: KdfVersion = KDF_VERSIONS.PBKDF2_V1;

const ARGON2_PARAMS = {
  iterations: 3,
  memory: 64 * 1024, // KiB
  parallelism: 1,
  hashLength: 32
};

export function setActiveSalt(salt: Uint8Array | null) {
  activeSalt = salt;
}

function ensureCrypto() {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Web Crypto API is unavailable in this environment.");
  }
  return window.crypto;
}

export async function deriveKey(
  password: string,
  salt: Uint8Array,
  options?: { version?: KdfVersion }
): Promise<{ key: CryptoKey; version: KdfVersion }> {
  const preferred = options?.version ?? DEFAULT_KDF_VERSION;

  if (preferred === KDF_VERSIONS.ARGON2ID_V1) {
    try {
      const key = await deriveArgon2Key(password, salt);
      return { key, version: KDF_VERSIONS.ARGON2ID_V1 };
    } catch (error) {
      console.warn("[crypto] Argon2id derive failed, falling back to PBKDF2", error);
      if (options?.version === KDF_VERSIONS.ARGON2ID_V1) {
        throw error;
      }
    }
  }

  const key = await derivePbkdf2Key(password, salt);
  return { key, version: KDF_VERSIONS.PBKDF2_V1 };
}

async function deriveArgon2Key(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const crypto = ensureCrypto();
  const passwordBytes = textEncoder.encode(password);
  const keyMaterial = argon2id(passwordBytes, salt, {
    t: ARGON2_PARAMS.iterations,
    m: ARGON2_PARAMS.memory,
    p: ARGON2_PARAMS.parallelism,
    dkLen: ARGON2_PARAMS.hashLength,
  });

  return crypto.subtle.importKey("raw", new Uint8Array(keyMaterial) as unknown as ArrayBuffer, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function derivePbkdf2Key(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const crypto = ensureCrypto();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100_000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(data: string, key: CryptoKey): Promise<string> {
  const crypto = ensureCrypto();
  if (!activeSalt) {
    throw new Error("Vault salt missing. Initialize or unlock the vault first.");
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, textEncoder.encode(data))
  );

  const combined = new Uint8Array(activeSalt.length + iv.length + ciphertext.length);
  combined.set(activeSalt, 0);
  combined.set(iv, activeSalt.length);
  combined.set(ciphertext, activeSalt.length + iv.length);

  return bytesToBase64(combined);
}

export async function decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
  const crypto = ensureCrypto();
  const buffer = base64ToBytes(encryptedData);
  const saltLength = activeSalt?.length ?? 16;
  const iv = buffer.slice(saltLength, saltLength + 12);
  const ciphertext = buffer.slice(saltLength + 12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return textDecoder.decode(plaintext);
}

export async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const crypto = ensureCrypto();
  const passBytes = textEncoder.encode(password);
  const data = new Uint8Array(salt.length + passBytes.length);
  data.set(salt, 0);
  data.set(passBytes, salt.length);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  return bytesToBase64(digest);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
