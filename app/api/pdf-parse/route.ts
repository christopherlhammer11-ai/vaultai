import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
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

    // Dynamic import with type assertion
    const pdfModule = await import("pdf-parse");
    const pdfParse = (pdfModule.default ?? pdfModule) as unknown as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
    const data = await pdfParse(buffer);

    return NextResponse.json({
      text: data.text,
      pages: data.numpages,
      filename: file.name,
    });
  } catch (error) {
    console.error("PDF parse error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to parse PDF: " + (error as Error).message },
      { status: 500 }
    );
  }
}
