import { prisma } from "@/lib/prisma";
import { requireAuth, jsonResponse, errorResponse, logActivity } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

// GET /api/persons/[id] — Detail person + children + spouses
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/persons/[id]">) {
  const { id } = await ctx.params;

  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      father: { select: { id: true, fullName: true, nickname: true, gender: true } },
      mother: { select: { id: true, fullName: true, nickname: true, gender: true } },
      childrenAsFather: {
        select: { id: true, fullName: true, nickname: true, gender: true, isAlive: true, generationNumber: true },
        orderBy: { birthDate: "asc" },
      },
      childrenAsMother: {
        select: { id: true, fullName: true, nickname: true, gender: true, isAlive: true, generationNumber: true },
        orderBy: { birthDate: "asc" },
      },
      marriagesAsHusband: {
        include: { wife: { select: { id: true, fullName: true, nickname: true } } },
      },
      marriagesAsWife: {
        include: { husband: { select: { id: true, fullName: true, nickname: true } } },
      },
    },
  });

  if (!person) {
    return errorResponse("Anggota tidak ditemukan", 404);
  }

  // Gabung children dari dua relasi
  const children = [
    ...person.childrenAsFather,
    ...person.childrenAsMother,
  ].filter((c, i, arr) => arr.findIndex((a) => a.id === c.id) === i);

  // Gabung spouses
  const spouses = [
    ...person.marriagesAsHusband.map((m) => ({ ...m.wife, marriageId: m.id })),
    ...person.marriagesAsWife.map((m) => ({ ...m.husband, marriageId: m.id })),
  ];

  return jsonResponse({
    ...person,
    children,
    spouses,
  });
}

// PUT /api/persons/[id] — Update person (admin only)
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/persons/[id]">) {
  const authResult = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  const { id } = await ctx.params;
  const body = await req.json();

  try {
    // Sanitize body: hapus field relasional dari objek person agar Prisma tidak error (500)
    const {
      father, mother, children, spouses,
      childrenAsFather, childrenAsMother,
      marriagesAsHusband, marriagesAsWife,
      _count,
      fatherId, motherId, spouseId,
      city, graveCity, village, district, // Legacy aliases not in DB
      ...safeData
    } = body;

    const updateData: any = {
      ...safeData,
    };

    if (fatherId !== undefined) {
      updateData.father = fatherId ? { connect: { id: fatherId } } : { disconnect: true };
    }
    if (motherId !== undefined) {
      updateData.mother = motherId ? { connect: { id: motherId } } : { disconnect: true };
    }
    
    // Determine link status
    if (fatherId || motherId || updateData.fatherId || updateData.motherId) {
       updateData.linkStatus = "LINKED";
    } else if (fatherId === null && motherId === null) {
       updateData.linkStatus = "UNLINKED";
    }

    const person = await prisma.person.update({
      where: { id },
      data: updateData,
    });

    // If spouseId is provided during update, create a Marriage record if it doesn't exist
    if (spouseId) {
      // Check existing marriage
      const existing = await prisma.marriage.findFirst({
        where: {
          OR: [
            { husbandId: id, wifeId: spouseId },
            { husbandId: spouseId, wifeId: id }
          ]
        }
      });
      if (!existing) {
        const isMale = person.gender === "MALE";
        await prisma.marriage.create({
          data: {
            husbandId: isMale ? person.id : spouseId,
            wifeId: isMale ? spouseId : person.id,
            status: "MARRIED",
          }
        });
      }
    }

    await logActivity(authResult.user.id, "Mengedit data anggota", person.fullName);

    return jsonResponse(person);
  } catch (e) {
    console.error("Update person error:", e);
    return errorResponse("Gagal memperbarui data anggota", 500);
  }
}

// DELETE /api/persons/[id] — Hapus person (admin only)
export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/persons/[id]">) {
  const authResult = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  const { id } = await ctx.params;

  try {
    const person = await prisma.person.findUnique({ where: { id } });
    if (!person) return errorResponse("Anggota tidak ditemukan", 404);

    await prisma.person.delete({ where: { id } });

    await logActivity(authResult.user.id, "Menghapus data anggota", person.fullName);

    return jsonResponse({ message: "Data anggota berhasil dihapus" });
  } catch (e) {
    console.error("Delete person error:", e);
    return errorResponse("Gagal menghapus data anggota", 500);
  }
}
