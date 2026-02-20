import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Store the lead (allow duplicate emails — tracks multiple downloads)
    await prisma.downloadLead.create({
      data: {
        email: normalized,
        source: source || "get-app",
        platform: platform || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[download-lead] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
