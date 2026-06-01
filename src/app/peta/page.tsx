import { prisma } from "@/lib/prisma";
import PetaClient from "./peta-client";
import { Person } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PetaPage() {
  const persons = await prisma.person.findMany({
    where: { linkStatus: "LINKED", status: "APPROVED" },
  });

  const serializedPersons = persons.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <PetaClient persons={serializedPersons as unknown as Person[]} />;
}
