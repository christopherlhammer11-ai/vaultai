/**
 * GET /api/license/device-id
 *
 * Generates or reads a stable device ID for this machine.
 * The device ID is derived from machine characteristics and persisted
 * to ~/.hammerlock/device-id for stability across restarts.
 */

import { NextResponse } from "next/server";
import crypto from "crypto";
import os from "os";
import fs from "fs/promises";
import path from "path";

const DEVICE_ID_PATH = path.join(os.homedir(), ".hammerlock", "device-id");

export async function GET() {
  // Check for existing device ID
  try {
    const existing = await fs.readFile(DEVICE_ID_PATH, "utf8");
    if (existing.trim()) {
      return NextResponse.json({
        deviceId: existing.trim(),
        deviceName: `${os.userInfo().username}'s ${os.hostname()}`,
      });
    }
  } catch {
    /* doesn't exist yet */
  }

  // Generate a new one from machine characteristics
  const raw = [
    os.hostname(),
    os.userInfo().username,
    os.homedir(),
    os.cpus()[0]?.model ?? "",
    os.totalmem().toString(),
  ].join("|");

  const deviceId = crypto
    .createHash("sha256")
    .update(raw)
    .digest("hex")
    .slice(0, 32);

  // Persist it
  await fs.mkdir(path.dirname(DEVICE_ID_PATH), { recursive: true });
  await fs.writeFile(DEVICE_ID_PATH, deviceId, "utf8");

  return NextResponse.json({
    deviceId,
    deviceName: `${os.userInfo().username}'s ${os.hostname()}`,
  });
}
