/**
 * POST /api/download-lead
 *
 * Database-free download lead capture.
 * Logs the lead for now — can be wired to a mailing list API (Mailchimp,
 * Resend, etc.) later. No Prisma/SQLite dependency.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, source, platform } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required." },
        { status: 400 }
      );
    }

    const normalized = email.trim().toLowerCase();

    // Log the lead (visible in Vercel function logs)
    // TODO: Wire to Mailchimp / Resend / ConvertKit for email capture
    console.log(
      `[download-lead] ${normalized} | source=${source || "get-app"} | platform=${platform || "unknown"} | ${new Date().toISOString()}`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[download-lead] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
