import { prisma } from "@/lib/prisma";
import { requireAuth, jsonResponse, errorResponse, logActivity } from "@/lib/api-helpers";
import { NextRequest } from "next/server";
import { Gender, LinkStatus } from "@prisma/client";

// POST /api/import — Bulk insert persons from CSV (admin only)
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  try {
    const { data } = await req.json();

    if (!Array.isArray(data)) {
      return errorResponse("Data harus berupa array", 400);
    }

    let successCount = 0;
    const errors: string[] = [];

    // Process sequentially to handle potential parent-child relations if inserted in order
    // In a real scenario with very large files, createMany is better, but this allows linking
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.fullName) {
          errors.push(`Baris ${i + 1}: Nama lengkap wajib diisi`);
          continue;
        }

        const gender = row.gender?.toUpperCase() === "FEMALE" || row.gender?.toUpperCase() === "P" ? "FEMALE" : "MALE";
        const generationNumber = row.generationNumber ? parseInt(row.generationNumber) : null;
        const isAlive = row.isAlive?.toString().toLowerCase() === "false" || row.isAlive === "0" ? false : true;

        await prisma.person.create({
          data: {
            fullName: row.fullName,
            nickname: row.nickname || null,
            gender: gender as Gender,
            isAlive,
            generationNumber,
            familyBranch: row.familyBranch || null,
            fatherNameFallback: row.fatherNameFallback || null,
            motherNameFallback: row.motherNameFallback || null,
            // If it has fallback names but no ID, it's UNLINKED
            linkStatus: (row.fatherNameFallback || row.motherNameFallback) ? "UNLINKED" : "LINKED",
            status: "APPROVED",
          },
        });
        successCount++;
      } catch (err: any) {
        errors.push(`Baris ${i + 1} (${row.fullName}): ${err.message}`);
      }
    }

    await logActivity(authResult.user.id, "Import CSV", `${successCount} anggota ditambahkan`);

    return jsonResponse({
      message: `Berhasil mengimport ${successCount} data`,
      successCount,
      errors
    }, 201);
  } catch (e) {
    console.error("Import error:", e);
    return errorResponse("Gagal memproses import data", 500);
  }
}
