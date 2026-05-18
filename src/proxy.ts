import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16: proxy.ts replaces middleware.ts
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ambil session token dari cookie Better Auth
  const sessionToken = request.cookies.get("better-auth.session_token")?.value;
  const isLoggedIn = !!sessionToken;

  // Protected routes: member area
  if (pathname.startsWith("/dasbor")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/masuk?redirect=" + encodeURIComponent(pathname), request.url));
    }
  }

  // Protected routes: admin area
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/masuk?redirect=" + encodeURIComponent(pathname), request.url));
    }
    // Note: granular role check dilakukan di API route handlers
    // Proxy hanya cek basic auth karena tidak bisa query DB di edge runtime
  }

  // Protected API routes
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
    // API routes handle their own auth via requireAuth() helper
    // Proxy just ensures cookies are forwarded
  }

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && (pathname === "/masuk" || pathname === "/daftar")) {
    return NextResponse.redirect(new URL("/dasbor", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dasbor/:path*",
    "/admin/:path*",
    "/masuk",
    "/daftar",
  ],
};
