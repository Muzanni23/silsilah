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

  // Fetch marriages to find existing spouse
  const marriages = await prisma.marriage.findMany({
    where: {
      OR: [
        { husbandId: id },
        { wifeId: id },
      ],
    },
  });

  // Get the spouse ID (first marriage for now)
  let existingSpouseId: string | undefined;
  if (marriages.length > 0) {
    const m = marriages[0];
    existingSpouseId = m.husbandId === id ? m.wifeId : m.husbandId;
  }

  // Parse tanggal ke string format YYYY-MM-DD
  const formattedPerson = {
    ...person,
    birthDate: person.birthDate ? person.birthDate : undefined,
    deathDate: person.deathDate ? person.deathDate : undefined,
    // Tambahkan spouseId dari marriage record
    spouseId: existingSpouseId,
  };

  return <EditPersonClient person={formattedPerson as unknown as Partial<Person>} />;
}
