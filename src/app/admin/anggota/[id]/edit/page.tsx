import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditPersonClient from "./edit-client";
import { Person } from "@/lib/types";

export default async function AdminEditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  // Tunggu params (Next.js 16 behavior)
  const { id } = await params;
  
  const person = await prisma.person.findUnique({
    where: { id },
  });

  if (!person) {
    notFound();
  }

  // Fetch marriages to find ALL existing spouses
  const marriages = await prisma.marriage.findMany({
    where: {
      OR: [
        { husbandId: id },
        { wifeId: id },
      ],
    },
    orderBy: { marriageOrder: "asc" },
  });

  // Get ALL spouse IDs from all marriages
  const existingSpouseIds: string[] = marriages.map((m) =>
    m.husbandId === id ? m.wifeId : m.husbandId
  );

  // Parse tanggal ke string format YYYY-MM-DD
  const formattedPerson = {
    ...person,
    birthDate: person.birthDate ? person.birthDate : undefined,
    deathDate: person.deathDate ? person.deathDate : undefined,
    // Tambahkan semua spouseIds dari marriage records
    spouseIds: existingSpouseIds,
    // Backward compat: tetap kirim spouseId pertama
    spouseId: existingSpouseIds[0],
  };

  return <EditPersonClient person={formattedPerson as unknown as Partial<Person>} />;
}
