import { NextResponse } from "next/server";
import {
  setServerSessionKey,
  clearServerSessionKey,
  hasServerSessionKey,
  encryptForFile,
  decryptFromFile,
  isEncrypted,
} from "@/lib/server-crypto";
import fs from "fs/promises";
import path from "path";
import os from "os";

const HAMMERLOCK_DIR = path.join(os.homedir(), ".hammerlock");
const PERSONA_PATH = path.join(HAMMERLOCK_DIR, "persona.md");
const ENV_PATH = path.join(HAMMERLOCK_DIR, ".env");

/**
 * POST /api/vault-session
 * Called by the client when vault is unlocked/locked.
 *
 * Body: { action: "unlock", keyHex: "..." } — sets session key, migrates plaintext→encrypted
 * Body: { action: "lock" } — clears session key from server memory
 * Body: { action: "status" } — returns whether server has a session key
 */
export async function POST(req: Request) {
  try {
    const { action, keyHex } = await req.json();

    if (action === "unlock") {
      if (!keyHex || typeof keyHex !== "string") {
        return NextResponse.json({ error: "keyHex required" }, { status: 400 });
      }

      setServerSessionKey(keyHex);

      // Migrate any existing plaintext files to encrypted
      await migrateFileToEncrypted(PERSONA_PATH);
      await migrateFileToEncrypted(ENV_PATH);

      // Load decrypted env vars into process.env so LLM routing works
      await loadEncryptedEnvVars();

      return NextResponse.json({ status: "ok", encrypted: true });
    }

    if (action === "lock") {
      clearServerSessionKey();
      return NextResponse.json({ status: "ok" });
    }

    if (action === "status") {
      return NextResponse.json({ hasKey: hasServerSessionKey() });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[vault-session] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Vault session error: " + (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * If a file exists as plaintext, encrypt it in place.
 * If already encrypted, do nothing.
 */
async function migrateFileToEncrypted(filePath: string) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    if (!content.trim()) return; // empty file, skip

    if (!isEncrypted(content)) {
      // File is plaintext — encrypt it
      const encrypted = encryptForFile(content);
      await fs.writeFile(filePath, encrypted, "utf8");
      console.log(`[vault-session] Migrated ${path.basename(filePath)} to encrypted storage`);
    }
  } catch {
    // File doesn't exist yet — that's fine
  }
}

/**
 * Decrypt .env and load all KEY=VALUE pairs into process.env.
 * Called on vault unlock so API keys are available for LLM routing.
 */
async function loadEncryptedEnvVars() {
  try {
    const raw = await fs.readFile(ENV_PATH, "utf8");
    const content = isEncrypted(raw) ? decryptFromFile(raw) : raw;
    if (!content) {
      console.warn("[vault-session] .env file exists but decryption returned null — key mismatch?");
      return;
    }

    // Parse KEY=VALUE lines and set in process.env
    let loaded = 0;
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 1) continue;
      let key = trimmed.slice(0, eqIdx).trim();
      // Strip surrounding quotes from value (handles "value" and 'value')
      let value = trimmed.slice(eqIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      // Migrate legacy VAULTAI_USER_* keys → HAMMERLOCK_USER_* (rebrand compat)
      if (key.startsWith("VAULTAI_USER_")) {
        key = key.replace("VAULTAI_USER_", "HAMMERLOCK_USER_");
      }
      if (key && value) {
        process.env[key] = value;
        loaded++;
      }
    }
    console.log(`[vault-session] Loaded ${loaded} env vars into process.env`);

    // Auto-set HAMMERLOCK_USER_*_KEY flags if user has their own keys loaded
    // (these are runtime flags for the credit system — not persisted)
    if (process.env.OPENAI_API_KEY) process.env.HAMMERLOCK_USER_OPENAI_KEY = "1";
    if (process.env.ANTHROPIC_API_KEY) process.env.HAMMERLOCK_USER_ANTHROPIC_KEY = "1";
  } catch (err) {
    console.warn("[vault-session] Failed to load .env:", (err as Error).message);
  }
}
