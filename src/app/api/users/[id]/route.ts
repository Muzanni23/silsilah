import { prisma } from "@/lib/prisma";
import { requireAuth, jsonResponse, errorResponse, logActivity } from "@/lib/api-helpers";
import { NextRequest } from "next/server";
import { sendUserStatusNotification } from "@/lib/email-service";

// PUT /api/users/[id] — Update user status/role (admin only)
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  const authResult = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const action = body.action as string;

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return errorResponse("User tidak ditemukan", 404);

    let updateData: Record<string, unknown> = {};
    let actionDesc = "";

    switch (action) {
      case "approve":
        updateData = { status: "ACTIVE", approvedBy: authResult.user.id, approvedAt: new Date() };
        actionDesc = "Menyetujui pendaftaran user";
        break;
      case "reject":
        updateData = { status: "SUSPENDED" };
        actionDesc = "Menolak pendaftaran user";
        break;
      case "suspend":
        updateData = { status: "SUSPENDED" };
        actionDesc = "Menangguhkan user";
        break;
      case "activate":
        updateData = { status: "ACTIVE" };
        actionDesc = "Mengaktifkan kembali user";
        break;
      case "promote_admin":
        if (authResult.user.role !== "SUPER_ADMIN") {
          return errorResponse("Hanya Super Admin yang bisa mempromosikan admin", 403);
        }
        updateData = { role: "ADMIN" };
        actionDesc = "Mempromosikan user ke Admin";
        break;
      case "demote_member":
        updateData = { role: "MEMBER" };
        actionDesc = "Menurunkan user ke Member";
        break;
      default:
        return errorResponse("Action tidak valid", 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    await logActivity(authResult.user.id, actionDesc, targetUser.name);

    // Kirim Notifikasi Email Asinkron (Graceful Fallback)
    if (["approve", "reject", "suspend", "activate"].includes(action)) {
      sendUserStatusNotification({
        to: updated.email,
        userName: updated.name,
        status: updated.status as "ACTIVE" | "REJECTED" | "SUSPENDED",
        adminNote: body.adminNote,
      }).catch((err) => {
        console.error("Gagal mengirim email notifikasi status user:", err);
      });
    }

    return jsonResponse({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      status: updated.status,
    });
  } catch (e) {
    console.error("Update user error:", e);
    return errorResponse("Gagal memperbarui user", 500);
  }
}
