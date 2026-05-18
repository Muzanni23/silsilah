import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Mendapatkan session user dari request
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

// Result types for requireAuth
type AuthError = { error: string; status: number };
type AuthUser = { id: string; name: string; email: string; role: string; status: string; [key: string]: unknown };
type AuthSuccess = { user: AuthUser; session: unknown };

// Validasi autentikasi dan opsional role check
export async function requireAuth(allowedRoles?: string[]): Promise<AuthError | AuthSuccess> {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized: Silakan login terlebih dahulu", status: 401 };
  }

  // Check user status
  const user = session.user as Record<string, unknown>;
  if (user.status !== "ACTIVE") {
    return { error: "Akun Anda belum diaktifkan atau ditangguhkan", status: 403 };
  }

  if (allowedRoles && !allowedRoles.includes(user.role as string)) {
    return { error: "Forbidden: Anda tidak memiliki akses", status: 403 };
  }

  return { user: session.user as unknown as AuthUser, session: session.session };
}

// Response helper
export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Log aktivitas
export async function logActivity(
  userId: string,
  action: string,
  target?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        target,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}
