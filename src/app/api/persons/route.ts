import { prisma } from "@/lib/prisma";
import { requireAuth, jsonResponse, errorResponse, logActivity } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

// GET /api/persons — List semua person
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const generation = searchParams.get("generation");
  const branch = searchParams.get("branch");
  const linkStatus = searchParams.get("linkStatus");
  const status = searchParams.get("status") || "APPROVED";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "100");

  const where: Record<string, unknown> = {};

  if (search) {
    where.fullName = { contains: search, mode: "insensitive" };
  }
  if (generation) {
    where.generationNumber = parseInt(generation);
  }
  if (branch) {
    where.familyBranch = { contains: branch, mode: "insensitive" };
  }
  if (linkStatus) {
    where.linkStatus = linkStatus;
  }
  if (status) {
    where.status = status;
  }

  const [persons, total] = await Promise.all([
    prisma.person.findMany({
      where,
      orderBy: [{ generationNumber: "asc" }, { fullName: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        father: { select: { id: true, fullName: true } },
        mother: { select: { id: true, fullName: true } },
        _count: {
          select: {
            childrenAsFather: true,
            childrenAsMother: true,
          },
        },
      },
    }),
    prisma.person.count({ where }),
  ]);

  return jsonResponse({
    data: persons,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/persons — Create person (admin only, bypass approval)
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  try {
    const body = await req.json();

    // Auto-detect generation dan inherit familyBranch dari orang tua
    let generationNumber = body.generationNumber;
    let familyBranch = body.familyBranch;

    let parentGen: number | null = null;
    let parentBranch: string | null = null;

    if (body.fatherId) {
      const father = await prisma.person.findUnique({
        where: { id: body.fatherId },
        select: { generationNumber: true, familyBranch: true },
      });
      if (father) {
        if (father.generationNumber !== null) parentGen = father.generationNumber;
        if (father.familyBranch) parentBranch = father.familyBranch;
      }
    }

    if (!parentGen && body.motherId) {
      const mother = await prisma.person.findUnique({
        where: { id: body.motherId },
        select: { generationNumber: true, familyBranch: true },
      });
      if (mother) {
        if (mother.generationNumber !== null) parentGen = mother.generationNumber;
        if (!parentBranch && mother.familyBranch) parentBranch = mother.familyBranch;
      }
    }

    if (parentGen !== null) {
      generationNumber = parentGen + 1;
    }
    if (parentBranch && !familyBranch) {
      familyBranch = parentBranch;
    }

    const person = await prisma.person.create({
      data: {
        fullName: body.fullName,
        nickname: body.nickname,
        gender: body.gender,
        isAlive: body.isAlive ?? true,
        generationNumber: generationNumber as number | undefined,
        familyBranch: familyBranch as string | undefined,
        fatherId: body.fatherId,
        motherId: body.motherId,
        fatherNameFallback: body.fatherNameFallback,
        motherNameFallback: body.motherNameFallback,
        birthDate: body.birthDate,
        birthPlace: body.birthPlace,
        country: body.country || "Indonesia",
        address: body.address,
        kelurahan: body.kelurahan,
        kecamatan: body.kecamatan,
        kabupaten: body.kabupaten,
        province: body.province,
        latitude: body.latitude ? parseFloat(body.latitude.toString()) : undefined,
        longitude: body.longitude ? parseFloat(body.longitude.toString()) : undefined,
        phone: body.phone,
        deathDate: body.deathDate,
        deathPlace: body.deathPlace,
        graveAddress: body.graveAddress,
        graveKelurahan: body.graveKelurahan,
        graveKecamatan: body.graveKecamatan,
        graveKabupaten: body.graveKabupaten,
        graveProvince: body.graveProvince,
        graveLatitude: body.graveLatitude ? parseFloat(body.graveLatitude.toString()) : undefined,
        graveLongitude: body.graveLongitude ? parseFloat(body.graveLongitude.toString()) : undefined,
        graveNotes: body.graveNotes,
        linkStatus: body.fatherId || body.motherId ? "LINKED" : "UNLINKED",
        status: "APPROVED",
      },
    });

    await logActivity(authResult.user.id, "Menambah data anggota", person.fullName);

    if (body.spouseId) {
      const isHusband = person.gender === "MALE";
      const husbandId = isHusband ? person.id : body.spouseId;
      const wifeId = isHusband ? body.spouseId : person.id;
      
      await prisma.marriage.create({
        data: {
          husbandId,
          wifeId,
          status: "MARRIED",
        },
      });
    }

    return jsonResponse(person, 201);
  } catch (e) {
    console.error("Create person error:", e);
    return errorResponse("Gagal membuat data anggota", 500);
  }
}
