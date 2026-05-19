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

  // Parse tanggal ke string format YYYY-MM-DD
  const formattedPerson = {
    ...person,
    birthDate: person.birthDate ? person.birthDate : undefined,
    deathDate: person.deathDate ? person.deathDate : undefined,
  };

  return <EditPersonClient person={formattedPerson as unknown as Partial<Person>} />;
}
