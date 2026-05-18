import { prisma } from "@/lib/prisma";
import { requireAuth, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  try {
    const [
      totalAnggota,
      masihHidup,
      wafat,
      orphanCount,
      pendingSubmissions,
      pendingUsers,
      totalUsers,
    ] = await Promise.all([
      prisma.person.count({ where: { status: "APPROVED" } }),
      prisma.person.count({ where: { status: "APPROVED", isAlive: true } }),
      prisma.person.count({ where: { status: "APPROVED", isAlive: false } }),
      prisma.person.count({ where: { status: "APPROVED", linkStatus: "UNLINKED" } }),
      prisma.personSubmission.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { status: "PENDING" } }),
      prisma.user.count(),
    ]);

    // Untuk generations dan branches, kita bisa pakai findMany dengan select distinct jika disupport,
    // atau pakai group by
    const branchesGroup = await prisma.person.groupBy({
      by: ['familyBranch'],
      where: { status: "APPROVED", familyBranch: { not: null } }
    });
    
    const generationsGroup = await prisma.person.groupBy({
      by: ['generationNumber'],
      where: { status: "APPROVED", generationNumber: { not: null } }
    });

    const branches = branchesGroup.map(b => b.familyBranch).filter(Boolean) as string[];

    return jsonResponse({
      totalAnggota,
      masihHidup,
      wafat,
      orphanCount,
      pendingSubmissions,
      pendingUsers,
      totalUsers,
      totalGenerations: generationsGroup.length,
      totalBranches: branches.length,
      branches,
    });
  } catch (e) {
    console.error("Stats error:", e);
    return errorResponse("Gagal mengambil statistik", 500);
  }
}
