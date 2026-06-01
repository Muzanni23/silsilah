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
    
    const generationsGroup = (await prisma.person.groupBy({
      by: ['generationNumber'],
      _count: { id: true },
      where: { status: "APPROVED", generationNumber: { not: null } },
      orderBy: { generationNumber: 'asc' }
    } as any)) as any[];

    const generationStats = generationsGroup.map(g => ({
      generation: g.generationNumber,
      count: g._count.id
    }));

    // Hitung 5 kota teratas domisili (hanya untuk anggota hidup)
    const citiesGroup = (await prisma.person.groupBy({
      by: ['kabupaten'],
      _count: { id: true },
      where: { 
        status: "APPROVED", 
        isAlive: true,
        kabupaten: { not: null, notIn: [""] }
      },
      orderBy: {
        _count: { id: 'desc' }
      },
      take: 5
    } as any)) as any[];

    const cityStats = citiesGroup.map(c => ({
      city: c.kabupaten,
      count: c._count.id
    }));

    // Hitung pertumbuhan data bulanan tahun berjalan
    const currentYear = new Date().getFullYear();
    const personsForGrowth = await prisma.person.findMany({
      where: {
        status: "APPROVED",
        createdAt: {
          gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
        }
      },
      select: { createdAt: true }
    });

    const growthStats = Array(12).fill(0);
    personsForGrowth.forEach(p => {
      const month = new Date(p.createdAt).getMonth();
      growthStats[month]++;
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
      generationStats,
      cityStats,
      growthStats,
    });
  } catch (e) {
    console.error("Stats error:", e);
    return errorResponse("Gagal mengambil statistik", 500);
  }
}
