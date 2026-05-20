import { prisma } from "@/lib/prisma";
import { getSession, jsonResponse, errorResponse } from "@/lib/api-helpers";

/**
 * POST /api/admin/bootstrap
 * 
 * Mengaktifkan user yang sedang login sebagai SUPER_ADMIN
 * HANYA jika belum ada user ACTIVE dengan role SUPER_ADMIN atau ADMIN di database.
 * Ini diperlukan untuk mengatasi chicken-and-egg problem:
 * user pertama yang mendaftar tidak bisa diaktifkan karena belum ada admin.
 */
export async function POST() {
  const session = await getSession();

  if (!session?.user) {
    return errorResponse("Unauthorized: Silakan login terlebih dahulu", 401);
  }

  try {
    // Cek apakah sudah ada ADMIN atau SUPER_ADMIN yang ACTIVE
    const existingAdmin = await prisma.user.findFirst({
      where: {
        status: "ACTIVE",
        role: { in: ["SUPER_ADMIN", "ADMIN"] },
      },
    });

    if (existingAdmin) {
      return errorResponse(
        "Bootstrap tidak diperlukan: sudah ada admin aktif di sistem. Hubungi admin untuk mengaktifkan akun Anda.",
        403
      );
    }

    // Tidak ada admin aktif — promosikan user yang sedang login
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        approvedAt: new Date(),
      },
    });

    return jsonResponse({
      message: "Akun Anda berhasil diaktifkan sebagai Super Admin!",
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        status: updated.status,
      },
    });
  } catch (e) {
    console.error("Bootstrap admin error:", e);
    return errorResponse("Gagal mengaktifkan admin", 500);
  }
}
