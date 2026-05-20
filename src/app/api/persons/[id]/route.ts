import { prisma } from "@/lib/prisma";
import { requireAuth, jsonResponse, errorResponse, logActivity } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

async function updateDescendantsGeneration(personId: string, parentGenNumber: number) {
  const nextGen = parentGenNumber + 1;
  const children = await prisma.person.findMany({
    where: {
      OR: [
        { fatherId: personId },
        { motherId: personId }
      ]
    },
    select: { id: true }
  });
  if (children.length > 0) {
    await prisma.person.updateMany({
      where: {
        id: { in: children.map(c => c.id) }
      },
      data: {
        generationNumber: nextGen
      }
    });
    for (const child of children) {
      await updateDescendantsGeneration(child.id, nextGen);
    }
  }
}

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
      fatherId, motherId, spouseId, spouseIds, newSpouses,
      city, graveCity, village, district, // Legacy aliases not in DB
      ...safeData
    } = body;

    const existingPerson = await prisma.person.findUnique({
      where: { id },
      select: { fatherId: true, motherId: true, generationNumber: true, familyBranch: true },
    });
    if (!existingPerson) {
      return errorResponse("Anggota tidak ditemukan", 404);
    }

    const effFatherId = fatherId !== undefined ? fatherId : existingPerson.fatherId;
    const effMotherId = motherId !== undefined ? motherId : existingPerson.motherId;

    let parentGen: number | null = null;
    let parentBranch: string | null = null;

    if (effFatherId) {
      const fatherObj = await prisma.person.findUnique({
        where: { id: effFatherId },
        select: { generationNumber: true, familyBranch: true },
      });
      if (fatherObj) {
        if (fatherObj.generationNumber !== null) parentGen = fatherObj.generationNumber;
        if (fatherObj.familyBranch) parentBranch = fatherObj.familyBranch;
      }
    }

    if (!parentGen && effMotherId) {
      const motherObj = await prisma.person.findUnique({
        where: { id: effMotherId },
        select: { generationNumber: true, familyBranch: true },
      });
      if (motherObj) {
        if (motherObj.generationNumber !== null) parentGen = motherObj.generationNumber;
        if (!parentBranch && motherObj.familyBranch) parentBranch = motherObj.familyBranch;
      }
    }

    let generationNumber = safeData.generationNumber;
    let familyBranch = safeData.familyBranch || existingPerson.familyBranch;

    if (parentGen !== null) {
      generationNumber = parentGen + 1;
    } else if (effFatherId === null && effMotherId === null) {
      if (generationNumber === undefined || generationNumber === null) {
        generationNumber = 1;
      }
    }

    if (parentBranch && !familyBranch) {
      familyBranch = parentBranch;
    }

    const updateData: any = {
      ...safeData,
      generationNumber,
      familyBranch,
    };

    if (fatherId !== undefined) {
      updateData.father = fatherId ? { connect: { id: fatherId } } : { disconnect: true };
    }
    if (motherId !== undefined) {
      updateData.mother = motherId ? { connect: { id: motherId } } : { disconnect: true };
    }
    
    // Determine link status
    if (effFatherId || effMotherId) {
       updateData.linkStatus = "LINKED";
    } else if (effFatherId === null && effMotherId === null) {
       updateData.linkStatus = "UNLINKED";
    }

    const person = await prisma.person.update({
      where: { id },
      data: updateData,
    });

    // Cascading recursive update of descendants' generation numbers
    if (generationNumber !== null && generationNumber !== existingPerson.generationNumber) {
      await updateDescendantsGeneration(id, generationNumber);
    }

    // Sinkronisasi data pasangan (multi-spouse support)
    // 1. Buat Person baru untuk pasangan yang belum ada di database
    const createdSpouseIds: string[] = [];
    if (newSpouses && Array.isArray(newSpouses) && newSpouses.length > 0) {
      for (const ns of newSpouses) {
        if (ns.fullName && ns.gender) {
          const newPerson = await prisma.person.create({
            data: {
              fullName: ns.fullName,
              gender: ns.gender,
              isAlive: true,
              linkStatus: "UNLINKED",
              status: "APPROVED",
            },
          });
          createdSpouseIds.push(newPerson.id);
        }
      }
    }

    // 2. Gabungkan semua spouse IDs (existing + baru dibuat)
    const existingIds: string[] = spouseIds || (spouseId ? [spouseId] : []);
    const targetSpouseIds: string[] = [...existingIds, ...createdSpouseIds];

    if (targetSpouseIds.length > 0 || spouseIds !== undefined) {
      // Ambil semua marriage yang sudah ada untuk orang ini
      const existingMarriages = await prisma.marriage.findMany({
        where: {
          OR: [
            { husbandId: id },
            { wifeId: id },
          ],
        },
      });

      // Map existing spouseIds dari marriage records
      const existingSpouseIdSet = new Set(
        existingMarriages.map((m) => m.husbandId === id ? m.wifeId : m.husbandId)
      );
      const targetSpouseIdSet = new Set(targetSpouseIds);

      // 1. Buat marriage baru untuk pasangan yang belum ada
      const isMale = person.gender === "MALE";
      const newlyCreatedMarriageSpouseIds: string[] = [];
      for (const sid of targetSpouseIds) {
        if (!existingSpouseIdSet.has(sid)) {
          const marriageOrder = existingMarriages.length + 1;
          await prisma.marriage.create({
            data: {
              husbandId: isMale ? person.id : sid,
              wifeId: isMale ? sid : person.id,
              status: "MARRIED",
              marriageOrder,
            },
          });
          newlyCreatedMarriageSpouseIds.push(sid);
        }
      }

      // 2. Hapus marriage yang sudah di-remove dari form
      for (const m of existingMarriages) {
        const existingSpouseId = m.husbandId === id ? m.wifeId : m.husbandId;
        if (!targetSpouseIdSet.has(existingSpouseId)) {
          await prisma.marriage.delete({ where: { id: m.id } });
        }
      }

      // 3. Auto-sinkronisasi anak: hubungkan anak ke kedua orang tua
      // Jika person LAKI-LAKI menikah → set motherId pada anak-anaknya yang belum punya ibu
      // Jika person PEREMPUAN menikah → set fatherId pada anak-anaknya yang belum punya ayah
      if (newlyCreatedMarriageSpouseIds.length > 0) {
        if (isMale) {
          // Person = ayah, pasangan baru = ibu
          // Cari anak yang fatherId = person.id tapi motherId kosong
          const orphanedChildren = await prisma.person.findMany({
            where: { fatherId: id, motherId: null },
            select: { id: true },
          });
          if (orphanedChildren.length > 0 && newlyCreatedMarriageSpouseIds.length > 0) {
            // Hubungkan ke pasangan pertama yang baru ditambahkan
            const firstNewSpouseId = newlyCreatedMarriageSpouseIds[0];
            await prisma.person.updateMany({
              where: { id: { in: orphanedChildren.map(c => c.id) } },
              data: { motherId: firstNewSpouseId },
            });
          }
        } else {
          // Person = ibu, pasangan baru = ayah
          const orphanedChildren = await prisma.person.findMany({
            where: { motherId: id, fatherId: null },
            select: { id: true },
          });
          if (orphanedChildren.length > 0 && newlyCreatedMarriageSpouseIds.length > 0) {
            const firstNewSpouseId = newlyCreatedMarriageSpouseIds[0];
            await prisma.person.updateMany({
              where: { id: { in: orphanedChildren.map(c => c.id) } },
              data: { fatherId: firstNewSpouseId },
            });
          }
        }
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
