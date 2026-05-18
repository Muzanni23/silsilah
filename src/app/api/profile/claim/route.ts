import { prisma } from "@/lib/prisma";
import { requireAuth, jsonResponse, errorResponse, logActivity } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

// POST /api/profile/claim
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  try {
    const { personId } = await req.json();

    if (!personId) {
      return errorResponse("personId tidak diberikan", 400);
    }

    // Pastikan person ada
    const person = await prisma.person.findUnique({
      where: { id: personId }
    });

    if (!person) {
      return errorResponse("Person tidak ditemukan di pohon keluarga", 404);
    }

    // Pastikan belum ada user lain yang mengklaim person ini
    const existingClaim = await prisma.user.findFirst({
      where: { linkedPersonId: personId, id: { not: authResult.user.id } }
    });

    if (existingClaim) {
      return errorResponse("Profil ini sudah diklaim oleh member lain", 400);
    }

    const updated = await prisma.user.update({
      where: { id: authResult.user.id },
      data: { linkedPersonId: personId },
    });

    await logActivity(authResult.user.id, "Mengklaim profil anggota", person.fullName);

    return jsonResponse({
      message: "Berhasil mengklaim profil",
      linkedPersonId: updated.linkedPersonId
    });
  } catch (e) {
    console.error("Claim profile error:", e);
    return errorResponse("Gagal mengklaim profil", 500);
  }
}
