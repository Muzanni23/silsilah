import { prisma } from "@/lib/prisma";
import { requireAuth, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

// GET /api/users — List users (admin only)
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      fatherName: true,
      motherName: true,
      role: true,
      status: true,
      approvedBy: true,
      approvedAt: true,
      createdAt: true,
    },
  });

  return jsonResponse({ data: users });
}
