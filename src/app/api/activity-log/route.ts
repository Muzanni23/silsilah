import { prisma } from "@/lib/prisma";
import { requireAuth, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

// GET /api/activity-log — List activity logs (admin only)
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.activityLog.count(),
  ]);

  return jsonResponse({
    data: logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
