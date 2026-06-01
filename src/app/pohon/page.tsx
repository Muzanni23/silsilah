import { prisma } from "@/lib/prisma";
import TreeClient from "./tree-client";
import { Person, Marriage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PohonPage() {
  const persons = await prisma.person.findMany({
    where: { status: "APPROVED" },
  });
  const marriages = await prisma.marriage.findMany();

  // Convert Date objects to strings for serialization if necessary, but Next.js App Router 
  // supports Dates in Server -> Client props now. Let's just stringify safely.
  const serializedPersons = persons.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const serializedMarriages = marriages.map(m => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return <TreeClient initialPersons={serializedPersons as unknown as Person[]} initialMarriages={serializedMarriages as unknown as Marriage[]} />;
}
