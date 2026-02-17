import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { encryptForFile, hasServerSessionKey } from "@/lib/server-crypto";

/**
 * POST /api/save-persona
 * Writes the user's persona to ~/.hammerlock/persona.md.
 * If the server has an active vault session key, the file is encrypted at rest.
 * Otherwise falls back to plaintext (will be migrated on next unlock).
 */
const HAMMERLOCK_DIR = path.join(os.homedir(), ".hammerlock");
const PERSONA_PATH = path.join(HAMMERLOCK_DIR, "persona.md");

export async function POST(req: Request) {
  try {
    const { persona } = await req.json();

    if (!persona || typeof persona !== "string") {
      return NextResponse.json({ error: "No persona provided" }, { status: 400 });
    }

    // Ensure ~/.hammerlock/ exists
    await fs.mkdir(HAMMERLOCK_DIR, { recursive: true });

    // Encrypt if we have a session key, otherwise plaintext (migrated later)
    const content = hasServerSessionKey() ? encryptForFile(persona) : persona;
    await fs.writeFile(PERSONA_PATH, content, "utf8");

    return NextResponse.json({ status: "ok", path: PERSONA_PATH, encrypted: hasServerSessionKey() });
  } catch (error) {
    console.error("[save-persona] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to save persona" },
      { status: 500 }
    );
  }
}
