import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * POST /api/share — Create a shareable link for selected vault entries
 * GET /api/share?id=xxx — Retrieve shared data by ID
 *
 * Shares are stored locally as JSON files in a .shares directory.
 * They expire after 24 hours by default.
 * Data is NOT encrypted in transit — the user chooses what to share.
 */

const SHARES_DIR = path.join(process.cwd(), ".shares");

async function ensureSharesDir() {
  try {
    await fs.mkdir(SHARES_DIR, { recursive: true });
  } catch {
    /* exists */
  }
}

export async function POST(req: Request) {
  try {
    const { entries, expiresIn, sharedBy } = await req.json();

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: "No entries to share" }, { status: 400 });
    }

    await ensureSharesDir();

    const shareId = crypto.randomBytes(12).toString("hex");
    const expiresMs = (expiresIn || 24) * 60 * 60 * 1000; // default 24h
    const expiresAt = new Date(Date.now() + expiresMs).toISOString();

    const shareData = {
      id: shareId,
      entries,
      sharedBy: sharedBy || "Anonymous",
      createdAt: new Date().toISOString(),
      expiresAt,
      accessCount: 0,
    };

    await fs.writeFile(
      path.join(SHARES_DIR, `${shareId}.json`),
      JSON.stringify(shareData, null, 2)
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    return NextResponse.json({
      shareId,
      shareUrl: `${baseUrl}/api/share?id=${shareId}`,
      expiresAt,
      entryCount: entries.length,
    });
  } catch (error) {
    console.error("Share creation error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to create share: " + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !/^[a-f0-9]{24}$/.test(id)) {
      return NextResponse.json({ error: "Invalid share ID" }, { status: 400 });
    }

    await ensureSharesDir();

    const filePath = path.join(SHARES_DIR, `${id}.json`);

    let raw: string;
    try {
      raw = await fs.readFile(filePath, "utf8");
    } catch {
      return NextResponse.json({ error: "Share not found or expired" }, { status: 404 });
    }

    const shareData = JSON.parse(raw);

    // Check expiration
    if (new Date(shareData.expiresAt) < new Date()) {
      await fs.unlink(filePath).catch(() => {});
      return NextResponse.json({ error: "Share has expired" }, { status: 410 });
    }

    // Increment access count
    shareData.accessCount += 1;
    await fs.writeFile(filePath, JSON.stringify(shareData, null, 2));

    return NextResponse.json({
      entries: shareData.entries,
      sharedBy: shareData.sharedBy,
      createdAt: shareData.createdAt,
      expiresAt: shareData.expiresAt,
      accessCount: shareData.accessCount,
    });
  } catch (error) {
    console.error("Share retrieval error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to retrieve share: " + (error as Error).message },
      { status: 500 }
    );
  }
}
