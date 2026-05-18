import { prisma } from "@/lib/prisma";
import { requireAuth, getSession, jsonResponse, errorResponse, logActivity } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

// GET /api/submissions — List submissions
export async function GET(req: NextRequest) {
  const authResult = await getSession();
  if (!authResult?.user) {
    return errorResponse("Unauthorized", 401);
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const user = authResult.user as unknown as { id: string; role: string; [key: string]: unknown };
  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

  const where: Record<string, unknown> = {};

  // Member hanya bisa lihat submisi sendiri
  if (!isAdmin) {
    where.submittedById = user.id;
  }

  if (status) {
    where.status = status;
  }

  const submissions = await prisma.personSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      submittedBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  return jsonResponse({ data: submissions });
}

// POST /api/submissions — Create submission (member)
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  try {
    const body = await req.json();

    const submission = await prisma.personSubmission.create({
      data: {
        submittedById: authResult.user.id,
        personData: body.personData,
        changeType: body.changeType || "ADD",
        targetPersonId: body.targetPersonId,
        targetPersonName: body.targetPersonName,
        status: "PENDING",
      },
    });

    await logActivity(
      authResult.user.id,
      body.changeType === "ADD" ? "Menambah data anggota (submisi)" : "Mengedit data anggota (submisi)",
      body.personData?.fullName || body.targetPersonName
    );

    return jsonResponse(submission, 201);
  } catch (e) {
    console.error("Create submission error:", e);
    return errorResponse("Gagal membuat submisi", 500);
  }
}
