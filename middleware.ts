import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * HammerLock AI middleware
 *
 * On Vercel (the public website), /chat and /vault are desktop-only features.
 * Redirect visitors to the download page instead of showing a broken console.
 * Locally (Electron or `npm run dev`), all routes work normally.
 */
export function middleware(request: NextRequest) {
  // Only redirect on Vercel (production web deployment)
  if (!process.env.VERCEL) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Desktop-only routes → redirect to download/get-started page
  if (pathname === "/chat" || pathname === "/vault") {
    const url = request.nextUrl.clone();
    url.pathname = "/get-app";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat", "/vault"],
};
