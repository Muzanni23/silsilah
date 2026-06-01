import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16: proxy.ts replaces middleware.ts
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ambil session token dari cookie Better Auth secara robust
  // (mencari cookie apa pun yang berakhiran "session_token" secara case-insensitive)
  const sessionCookie = request.cookies.getAll().find(
    c => c.name.toLowerCase().endsWith("session_token")
  );
  const sessionToken = sessionCookie?.value;
  const isLoggedIn = !!sessionToken;

  console.log("Proxy auth check:", {
    pathname,
    detectedCookie: sessionCookie?.name,
    isLoggedIn
  });

  // Protected routes: member area, pohon silsilah, and peta lokasi
  if (pathname.startsWith("/dasbor") || pathname.startsWith("/pohon") || pathname.startsWith("/peta")) {
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
    "/pohon/:path*",
    "/peta/:path*",
    "/pohon",
    "/peta",
    "/masuk",
    "/daftar",
  ],
};
