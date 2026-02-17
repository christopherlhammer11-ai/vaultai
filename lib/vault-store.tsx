// 🔨🔐 HammerLock AI — Vault Store
// AES-256 encrypted state management. Your data never leaves this device.
"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  base64ToBytes,
  bytesToBase64,
  decrypt,
  deriveKey,
  encrypt,
  hashPassword,
  setActiveSalt,
  DEFAULT_KDF_VERSION,
  FALLBACK_KDF_VERSION,
  KDF_VERSIONS
} from "./crypto";
import type { KdfVersion } from "./crypto";

export type SourceRef = {
  title: string;
  url: string;
  domain: string;
  age?: string | null;
};

export type VaultMessage = {
  id: string;
  role: "user" | "ai" | "error";
  content: string;
  pending?: boolean;
  timestamp?: string;
  /** Attached web sources for search-powered responses */
  sources?: SourceRef[];
  sourcesSummary?: string;
  /** Follow-up suggestion questions shown as clickable chips */
  followUps?: string[];
  /** OpenClaw action type when an action was executed ("reminder", "email", "message", etc.) */
  actionType?: string;
  /** Whether the OpenClaw action succeeded or failed */
  actionStatus?: "success" | "error";
};

export type VaultFile = {
  id: string;
  name: string;
  type: "pdf" | "image" | "note" | "snippet";
  /** For notes/snippets: the text content. For files: base64 data or extracted text. */
  content: string;
  /** Original MIME type for files */
  mimeType?: string;
  /** File size in bytes (original, before base64) */
  size?: number;
  /** Tags for organization */
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type VaultData = {
  persona: string | null;
  chatHistory: VaultMessage[];
  settings: Record<string, unknown>;
  /** Encrypted file vault — PDFs, images, notes, code snippets */
  vaultFiles?: VaultFile[];
};

const defaultVaultData = (): VaultData => ({
  persona: null,
  chatHistory: [],
  settings: {}
});

/** Notify server of vault unlock/lock so it can encrypt/decrypt files at rest */
async function syncServerVaultSession(action: "unlock" | "lock", key?: CryptoKey) {
  try {
    if (action === "unlock" && key) {
      const exported = await crypto.subtle.exportKey("raw", key);
      const keyHex = Array.from(new Uint8Array(exported))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      await fetch("/api/vault-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlock", keyHex }),
      });
    } else {
      await fetch("/api/vault-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lock" }),
      });
    }
  } catch (err) {
    console.warn("[vault] Server session sync failed:", err);
  }
}

const STORAGE_KEYS = {
  salt: "vault_salt",
  passwordHash: "vault_password_hash",
  encrypted: "vault_encrypted_data",
  kdfVersion: "vault_kdf_version"
};

/* ── Session persistence (survives refresh, clears on tab close) ── */
const SESSION_KEYS = {
  derivedKey: "hammerlock_session_key",
  salt: "hammerlock_session_salt",
  kdfVersion: "hammerlock_session_kdf",
};

async function persistSession(key: CryptoKey, salt: Uint8Array, version: KdfVersion) {
  if (typeof window === "undefined") return;
  try {
    const exported = await crypto.subtle.exportKey("raw", key);
    const keyB64 = bytesToBase64(new Uint8Array(exported));
    sessionStorage.setItem(SESSION_KEYS.derivedKey, keyB64);
    sessionStorage.setItem(SESSION_KEYS.salt, bytesToBase64(salt));
    sessionStorage.setItem(SESSION_KEYS.kdfVersion, version);
  } catch (err) {
    console.warn("[vault] Failed to persist session:", err);
  }
}

async function restoreSession(): Promise<{
  key: CryptoKey;
  data: VaultData;
  salt: Uint8Array;
} | null> {
  if (typeof window === "undefined") return null;

  const keyB64 = sessionStorage.getItem(SESSION_KEYS.derivedKey);
  const saltB64 = sessionStorage.getItem(SESSION_KEYS.salt);
  const encryptedPayload = localStorage.getItem(STORAGE_KEYS.encrypted);

  if (!keyB64 || !saltB64 || !encryptedPayload) return null;

  try {
    const keyBytes = base64ToBytes(keyB64);
    const salt = base64ToBytes(saltB64);

    // Re-import key (extractable: false — we don't need to re-export)
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes as unknown as ArrayBuffer,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );

    setActiveSalt(salt);
    const plaintext = await decrypt(encryptedPayload, key);
    const data: VaultData = JSON.parse(plaintext);

    return { key, data, salt };
  } catch (err) {
    console.warn("[vault] Session restore failed:", err);
    clearSession();
    return null;
  }
}

function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEYS.derivedKey);
  sessionStorage.removeItem(SESSION_KEYS.salt);
  sessionStorage.removeItem(SESSION_KEYS.kdfVersion);
}
/* ── end session persistence ── */

const KDF_VERSION_SET = new Set<KdfVersion>(Object.values(KDF_VERSIONS));
const LEGACY_KDF_VERSION: KdfVersion = FALLBACK_KDF_VERSION;

type VaultContextValue = {
  isUnlocked: boolean;
  hasVault: boolean;
  vaultData: VaultData | null;
  initializeVault: (password: string) => Promise<void>;
  unlockVault: (password: string) => Promise<void>;
  updateVaultData: (updater: (prev: VaultData) => VaultData) => Promise<void>;
  saveVault: () => Promise<void>;
  lockVault: () => void;
  clearVault: () => void;
};

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

const ensureClientWindow = () => {
  if (typeof window === "undefined") {
    throw new Error("Vault operations can only run in the browser.");
  }
  return window;
};

const parseStoredKdfVersion = (value: string | null): KdfVersion | null => {
  if (!value) return null;
  return KDF_VERSION_SET.has(value as KdfVersion) ? (value as KdfVersion) : null;
};

const readStoredKdfVersion = (w: Window): KdfVersion => {
  const stored = parseStoredKdfVersion(w.localStorage.getItem(STORAGE_KEYS.kdfVersion));
  if (stored) return stored;
  // Legacy vaults won't have a version flag but will have password hash/salt.
  if (w.localStorage.getItem(STORAGE_KEYS.passwordHash)) {
    return LEGACY_KDF_VERSION;
  }
  return DEFAULT_KDF_VERSION;
};

const persistKdfVersion = (w: Window, version: KdfVersion) => {
  w.localStorage.setItem(STORAGE_KEYS.kdfVersion, version);
};

export function VaultProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasVault, setHasVault] = useState(false);
  const [vaultData, setVaultData] = useState<VaultData | null>(null);

  const keyRef = useRef<CryptoKey | null>(null);
  const dataRef = useRef<VaultData | null>(null);

  const syncFlags = useCallback(() => {
    if (typeof window === "undefined") return;
    const saltString = window.localStorage.getItem(STORAGE_KEYS.salt);
    if (saltString) {
      const salt = base64ToBytes(saltString);
      setActiveSalt(salt);
      setHasVault(true);
    } else {
      setActiveSalt(null);
      setHasVault(false);
    }
  }, []);

  const lockVault = useCallback(() => {
    keyRef.current = null;
    dataRef.current = null;
    setActiveSalt(null);
    setVaultData(null);
    setIsUnlocked(false);
    clearSession();
    // Clear server-side session key
    syncServerVaultSession("lock");
  }, []);

  // Sync flags on mount (no longer locks on beforeunload — session handles that)
  useEffect(() => {
    if (typeof window === "undefined") return;
    syncFlags();
  }, [syncFlags]);

  // Auto-restore from sessionStorage on mount (survives page refresh)
  useEffect(() => {
    if (typeof window === "undefined" || isUnlocked) return;

    let cancelled = false;
    (async () => {
      const session = await restoreSession();
      if (session && !cancelled) {
        keyRef.current = session.key;
        dataRef.current = session.data;
        setActiveSalt(session.salt);
        // Re-sync server session key BEFORE marking unlocked
        // so API keys are loaded before user can send messages
        await syncServerVaultSession("unlock", session.key);
        setVaultData(session.data);
        setIsUnlocked(true);
        setHasVault(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  const persistEncrypted = useCallback(async (data: VaultData) => {
    if (!keyRef.current) {
      throw new Error("Vault is locked. Cannot save.");
    }
    const w = ensureClientWindow();
    const encryptedPayload = await encrypt(JSON.stringify(data), keyRef.current);
    w.localStorage.setItem(STORAGE_KEYS.encrypted, encryptedPayload);
  }, []);

  const initializeVault = useCallback(
    async (password: string) => {
      if (!password) throw new Error("Password required");
      const w = ensureClientWindow();
      const crypto = w.crypto;
      const salt = crypto.getRandomValues(new Uint8Array(16));
      setActiveSalt(salt);
      const { key, version } = await deriveKey(password, salt);
      const passwordHash = await hashPassword(password, salt);
      w.localStorage.setItem(STORAGE_KEYS.salt, bytesToBase64(salt));
      w.localStorage.setItem(STORAGE_KEYS.passwordHash, passwordHash);
      persistKdfVersion(w, version);
      const initialData = defaultVaultData();
      keyRef.current = key;
      dataRef.current = initialData;
      await persistEncrypted(initialData);
      // Sync encryption key to server BEFORE marking as unlocked
      // so API keys are available when user sends first message
      await syncServerVaultSession("unlock", key);
      await persistSession(key, salt, version);
      setVaultData(initialData);
      setIsUnlocked(true);
      setHasVault(true);
    },
    [persistEncrypted]
  );

  const unlockVault = useCallback(async (password: string) => {
    if (!password) throw new Error("Password required");
    const w = ensureClientWindow();
    const saltString = w.localStorage.getItem(STORAGE_KEYS.salt);
    const hashStored = w.localStorage.getItem(STORAGE_KEYS.passwordHash);
    const encryptedPayload = w.localStorage.getItem(STORAGE_KEYS.encrypted);
    if (!saltString || !hashStored || !encryptedPayload) {
      throw new Error("Vault not initialized");
    }
    const salt = base64ToBytes(saltString);
    setActiveSalt(salt);
    const requestedVersion = readStoredKdfVersion(w);
    const { key, version } = await deriveKey(password, salt, { version: requestedVersion });
    persistKdfVersion(w, version);
    const hashCandidate = await hashPassword(password, salt);
    if (hashCandidate !== hashStored) {
      throw new Error("Wrong password");
    }
    const plaintext = await decrypt(encryptedPayload, key);
    const parsed: VaultData = JSON.parse(plaintext);
    keyRef.current = key;
    dataRef.current = parsed;
    // Sync encryption key to server BEFORE marking as unlocked
    // so API keys are available when user sends first message
    await syncServerVaultSession("unlock", key);
    await persistSession(key, salt, version);
    setVaultData(parsed);
    setIsUnlocked(true);
    setHasVault(true);
  }, []);

  const updateVaultData = useCallback(
    async (updater: (prev: VaultData) => VaultData) => {
      if (!keyRef.current) throw new Error("Vault is locked");
      const base = dataRef.current ?? defaultVaultData();
      const clone: VaultData = {
        ...base,
        chatHistory: [...base.chatHistory],
        settings: { ...base.settings }
      };
      const next = updater(clone);
      dataRef.current = next;
      setVaultData(next);
      await persistEncrypted(next);
    },
    [persistEncrypted]
  );

  const saveVault = useCallback(async () => {
    if (!dataRef.current) return;
    await persistEncrypted(dataRef.current);
  }, [persistEncrypted]);

  const clearVault = useCallback(() => {
    const w = ensureClientWindow();
    w.localStorage.removeItem(STORAGE_KEYS.salt);
    w.localStorage.removeItem(STORAGE_KEYS.passwordHash);
    w.localStorage.removeItem(STORAGE_KEYS.encrypted);
    w.localStorage.removeItem(STORAGE_KEYS.kdfVersion);
    clearSession();
    lockVault();
    syncFlags();
  }, [lockVault, syncFlags]);

  const value = useMemo(
    () => ({
      isUnlocked,
      hasVault,
      vaultData,
      initializeVault,
      unlockVault,
      updateVaultData,
      saveVault,
      lockVault,
      clearVault
    }),
    [
      isUnlocked,
      hasVault,
      vaultData,
      initializeVault,
      unlockVault,
      updateVaultData,
      saveVault,
      lockVault,
      clearVault
    ]
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVault must be used within VaultProvider");
  }
  return context;
}
