"use client";

import dynamic from "next/dynamic";
import { Person, Marriage } from "@/lib/types";

const FamilyTreeCanvas = dynamic(
  () => import("@/components/tree/family-tree-canvas"),
  { ssr: false, loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted">Memuat pohon keluarga...</p>
      </div>
    </div>
  )}
);

export default function TreeClient({ initialPersons, initialMarriages }: { initialPersons: Person[], initialMarriages: Marriage[] }) {
  return <FamilyTreeCanvas initialPersons={initialPersons} initialMarriages={initialMarriages} />;
}
