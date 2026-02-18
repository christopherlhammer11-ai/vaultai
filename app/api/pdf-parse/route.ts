import { NextResponse } from "next/server";
import { requireTier } from "@/lib/license-guard";

export async function POST(req: Request) {
  // Tier gate: PDF parsing requires Pro or higher
  const tierCheck = await requireTier("pdf-parse");
  if (!tierCheck.allowed) {
    return NextResponse.json(
      { error: tierCheck.reason, upgradeRequired: true, requiredTier: tierCheck.requiredTier },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData() as unknown as globalThis.FormData;
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // pdf-parse v2 uses a class-based API
    const pdfModule = await import("pdf-parse");
    const PDFParse = (pdfModule as any).PDFParse || (pdfModule as any).default?.PDFParse;

    if (!PDFParse) {
      throw new Error("PDFParse class not found in pdf-parse module");
    }

    const parser = new PDFParse({ data: buffer });
    await parser.load();
    const textResult = await parser.getText();
    const info = await parser.getInfo();
    await parser.destroy();

    // getText returns an object with a text property, or a string
    const text = typeof textResult === "string" ? textResult : (textResult?.text || String(textResult));
    const pages = info?.numPages || info?.pages || 0;

    return NextResponse.json({
      text,
      pages,
      filename: file.name,
    });
  } catch (error) {
    const msg = (error as Error).message;
    console.error("PDF parse error:", msg);
    console.error("PDF parse stack:", (error as Error).stack);
    return NextResponse.json(
      { error: "Failed to parse PDF: " + msg },
      { status: 500 }
    );
  }
}
