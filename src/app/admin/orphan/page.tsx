"use client";

import { useState, useEffect } from "react";
import { fetchOrphanPersons } from "@/lib/api";
import { Person, Gender } from "@/lib/types";
import { Link2, Search, AlertTriangle, Plus } from "lucide-react";

export default function OrphanPage() {
  const [orphans, setOrphans] = useState<Person[]>([]);
  useEffect(() => { fetchOrphanPersons().then(setOrphans); }, []);

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={20} className="text-[var(--warning)]" />
          <h1 className="text-xl font-bold">Node Tidak Terhubung</h1>
        </div>
        <p className="text-sm text-muted">
          {orphans.length} anggota belum terhubung ke pohon keluarga utama. Hubungkan ke parent yang benar.
        </p>
      </div>

      {orphans.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Link2 size={40} className="text-[var(--success)] mx-auto mb-3" />
          <p className="font-semibold mb-1">Semua node terhubung! 🎉</p>
          <p className="text-sm text-muted">Tidak ada anggota yang perlu dihubungkan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orphans.map((p) => (
            <div key={p.id} className="glass rounded-xl p-5 border-l-4 border-[var(--warning)]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-dashed border-muted ${
                    p.gender === Gender.MALE ? "text-male" : "text-female"
                  }`}>
                    {p.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{p.fullName}</p>
                    {p.fatherNameFallback && (
                      <p className="text-xs text-muted">Ayah (teks): <span className="text-foreground">{p.fatherNameFallback}</span></p>
                    )}
                    {p.motherNameFallback && (
                      <p className="text-xs text-muted">Ibu (teks): <span className="text-foreground">{p.motherNameFallback}</span></p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {p.city && `${p.city} · `}Gen {p.generationNumber || "?"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--info-bg)] text-[var(--info)] hover:brightness-125 transition-all" title="Cari & Hubungkan">
                    <Search size={12} /> Cari & Link
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-white/5 transition-colors" title="Buat Parent Baru">
                    <Plus size={12} /> Buat Parent
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
