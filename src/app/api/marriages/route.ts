import { prisma } from "@/lib/prisma";
import { requireAuth, jsonResponse, errorResponse, logActivity } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

// GET /api/marriages — List marriages
export async function GET() {
  const marriages = await prisma.marriage.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      husband: { select: { id: true, fullName: true } },
      wife: { select: { id: true, fullName: true } },
    },
  });

  return jsonResponse({ data: marriages });
}

// POST /api/marriages — Create marriage (admin only)
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  try {
    const body = await req.json();

    const marriage = await prisma.marriage.create({
      data: {
        husbandId: body.husbandId,
        wifeId: body.wifeId,
        marriageDate: body.marriageDate,
        marriagePlace: body.marriagePlace,
        status: body.status || "MARRIED",
        marriageOrder: body.marriageOrder || 1,
      },
    });

    await logActivity(authResult.user.id, "Menambah data pernikahan", `${body.husbandId} & ${body.wifeId}`);

    return jsonResponse(marriage, 201);
  } catch (e) {
    console.error("Create marriage error:", e);
    return errorResponse("Gagal membuat data pernikahan", 500);
  }
}
