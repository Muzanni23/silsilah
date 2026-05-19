import { prisma } from "@/lib/prisma";
import { requireAuth, jsonResponse, errorResponse, logActivity } from "@/lib/api-helpers";
import { NextRequest } from "next/server";
import { sendSubmissionNotification } from "@/lib/email-service";

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

// GET /api/submissions/[id] — Detail submission
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/submissions/[id]">) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  const { id } = await ctx.params;

  const submission = await prisma.personSubmission.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  if (!submission) {
    return errorResponse("Submisi tidak ditemukan", 404);
  }

  return jsonResponse(submission);
}

// PUT /api/submissions/[id] — Approve/Reject (admin only)
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/submissions/[id]">) {
  const authResult = await requireAuth(["SUPER_ADMIN", "ADMIN"]);
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const action = body.action as "APPROVED" | "REJECTED";

  if (!["APPROVED", "REJECTED"].includes(action)) {
    return errorResponse("Action harus APPROVED atau REJECTED", 400);
  }

  try {
    const submission = await prisma.personSubmission.findUnique({
      where: { id },
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    });
    
    if (!submission) return errorResponse("Submisi tidak ditemukan", 404);
    if (submission.status !== "PENDING") return errorResponse("Submisi sudah diproses", 400);

    // Update submission status
    const updated = await prisma.personSubmission.update({
      where: { id },
      data: {
        status: action,
        adminNote: body.adminNote,
        reviewedById: authResult.user.id,
        reviewedAt: new Date(),
      },
    });

    // Jika disetujui dan tipe ADD, buat Person baru
    if (action === "APPROVED" && submission.changeType === "ADD") {
      const data = submission.personData as Record<string, any>;
      
      // Auto-detect generation dan inherit familyBranch dari orang tua
      let generationNumber = data.generationNumber;
      let familyBranch = data.familyBranch;

      let parentGen: number | null = null;
      let parentBranch: string | null = null;

      if (data.fatherId) {
        const father = await prisma.person.findUnique({
          where: { id: data.fatherId },
          select: { generationNumber: true, familyBranch: true },
        });
        if (father) {
          if (father.generationNumber !== null) parentGen = father.generationNumber;
          if (father.familyBranch) parentBranch = father.familyBranch;
        }
      }

      if (!parentGen && data.motherId) {
        const mother = await prisma.person.findUnique({
          where: { id: data.motherId },
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
          fullName: data.fullName as string,
          nickname: data.nickname as string | undefined,
          gender: data.gender as "MALE" | "FEMALE",
          isAlive: (data.isAlive as boolean) ?? true,
          generationNumber: generationNumber as number | undefined,
          familyBranch: familyBranch as string | undefined,
          fatherId: data.fatherId as string | undefined,
          motherId: data.motherId as string | undefined,
          fatherNameFallback: data.fatherNameFallback as string | undefined,
          motherNameFallback: data.motherNameFallback as string | undefined,
          birthDate: data.birthDate as string | undefined,
          birthPlace: data.birthPlace as string | undefined,
          address: data.address as string | undefined,
          kelurahan: data.kelurahan as string | undefined,
          kecamatan: data.kecamatan as string | undefined,
          kabupaten: data.kabupaten as string | undefined,
          province: data.province as string | undefined,
          latitude: data.latitude ? parseFloat(data.latitude.toString()) : undefined,
          longitude: data.longitude ? parseFloat(data.longitude.toString()) : undefined,
          phone: data.phone as string | undefined,
          deathDate: data.deathDate as string | undefined,
          graveAddress: data.graveAddress as string | undefined,
          graveKelurahan: data.graveKelurahan as string | undefined,
          graveKecamatan: data.graveKecamatan as string | undefined,
          graveKabupaten: data.graveKabupaten as string | undefined,
          graveProvince: data.graveProvince as string | undefined,
          graveLatitude: data.graveLatitude ? parseFloat(data.graveLatitude.toString()) : undefined,
          graveLongitude: data.graveLongitude ? parseFloat(data.graveLongitude.toString()) : undefined,
          graveNotes: data.graveNotes as string | undefined,
          linkStatus: data.fatherId ? "LINKED" : "UNLINKED",
          status: "APPROVED",
        },
      });

      if (data.spouseId) {
        const isHusband = person.gender === "MALE";
        const husbandId = isHusband ? person.id : (data.spouseId as string);
        const wifeId = isHusband ? (data.spouseId as string) : person.id;
        
        await prisma.marriage.create({
          data: {
            husbandId,
            wifeId,
            status: "MARRIED",
          },
        });
      }
    }

    // Jika disetujui dan tipe EDIT, update Person dengan sanitasi
    if (action === "APPROVED" && submission.changeType === "EDIT" && submission.targetPersonId) {
      const data = submission.personData as Record<string, any>;
      
      // Sanitasi input agar tidak error relasi di Prisma
      const {
        father, mother, children, spouses,
        childrenAsFather, childrenAsMother,
        marriagesAsHusband, marriagesAsWife,
        _count,
        fatherId, motherId, spouseId,
        city, graveCity, village, district,
        latitude, longitude, graveLatitude, graveLongitude,
        ...safeData
      } = data;

      const existingPerson = await prisma.person.findUnique({
        where: { id: submission.targetPersonId },
        select: { fatherId: true, motherId: true, generationNumber: true, familyBranch: true },
      });

      if (existingPerson) {
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

        if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude.toString()) : null;
        if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude.toString()) : null;
        if (graveLatitude !== undefined) updateData.graveLatitude = graveLatitude ? parseFloat(graveLatitude.toString()) : null;
        if (graveLongitude !== undefined) updateData.graveLongitude = graveLongitude ? parseFloat(graveLongitude.toString()) : null;

        if (fatherId !== undefined) {
          updateData.father = fatherId ? { connect: { id: fatherId } } : { disconnect: true };
        }
        if (motherId !== undefined) {
          updateData.mother = motherId ? { connect: { id: motherId } } : { disconnect: true };
        }

        await prisma.person.update({
          where: { id: submission.targetPersonId },
          data: updateData,
        });

        if (generationNumber !== null && generationNumber !== existingPerson.generationNumber) {
          await updateDescendantsGeneration(submission.targetPersonId, generationNumber);
        }
      }
    }

    const personName =
      (submission.personData as Record<string, unknown>).fullName ||
      submission.targetPersonName;

    await logActivity(
      authResult.user.id,
      action === "APPROVED" ? "Menyetujui submisi data" : "Menolak submisi data",
      personName as string
    );

    // Kirim Notifikasi Email Asinkron (Graceful Fallback)
    if (submission.submittedBy?.email) {
      sendSubmissionNotification({
        to: submission.submittedBy.email,
        userName: submission.submittedBy.name || "Anggota Keluarga",
        personName: personName as string,
        changeType: submission.changeType as "ADD" | "EDIT",
        status: action,
        adminNote: body.adminNote,
      }).catch((err) => {
        console.error("Gagal mengirim email notifikasi keputusan submisi:", err);
      });
    }

    return jsonResponse(updated);
  } catch (e) {
    console.error("Review submission error:", e);
    return errorResponse("Gagal memproses submisi", 500);
  }
}
