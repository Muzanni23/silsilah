"use client";

import { useState, useEffect } from "react";
import { fetchPersons, deletePerson } from "@/lib/api";
import { Person, Gender } from "@/lib/types";
import { Search, Users, MapPin, ChevronDown, ChevronUp, Phone, FileUp, Download, Trash, Edit2 } from "lucide-react";
import Link from "next/link";

export default function AnggotaPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "gen">("gen");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadPersons = () => fetchPersons({ search: search || undefined }).then(setPersons);

  useEffect(() => {
    loadPersons();
  }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus ${name}? Data tidak dapat dikembalikan.`)) {
      const success = await deletePerson(id);
      if (success) loadPersons();
    }
  };

  const sorted = [...persons].sort((a, b) => {
    if (sortKey === "gen") return (a.generationNumber || 0) - (b.generationNumber || 0);
    return a.fullName.localeCompare(b.fullName);
  });

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold mb-1">Data Anggota</h1>
          <p className="text-sm text-muted">{persons.length} anggota keluarga tercatat.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/import" className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5">
            <FileUp size={14} /> Import CSV
          </Link>
          <button className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="flex gap-2 mb-5">
        <div className="flex-1 glass rounded-xl px-3 py-2 flex items-center gap-2">
          <Search size={15} className="text-muted" />
          <input
            type="text"
            placeholder="Cari nama, kota, atau cabang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1"
          />
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as "name" | "gen")}
          className="glass rounded-xl px-3 py-2 text-xs text-foreground border-none cursor-pointer bg-transparent"
        >
          <option value="gen" className="bg-card">Urutkan: Generasi</option>
          <option value="name" className="bg-card">Urutkan: Nama</option>
        </select>
      </div>

      {/* Table */}
      <div className="space-y-2">
        {sorted.map((p) => (
          <div key={p.id} className="glass rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
              className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                p.gender === Gender.MALE ? "text-male bg-male/10" : "text-female bg-female/10"
              }`}>
                {p.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.fullName}</p>
                <p className="text-[11px] text-muted">
                  Gen {p.generationNumber || "?"} · {p.familyBranch || "–"} · {p.isAlive ? "Hidup" : "Wafat"}
                </p>
              </div>
              {p.city && (
                <span className="hidden sm:flex items-center gap-1 text-[11px] text-muted">
                  <MapPin size={11} /> {p.city}
                </span>
              )}
              {expandedId === p.id ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
            </button>

            {expandedId === p.id && (
              <div className="border-t border-border px-5 py-4 grid grid-cols-2 gap-3 text-xs animate-fade-in">
                <Info label="Nama Lengkap" value={p.fullName} />
                <Info label="Panggilan" value={p.nickname || "–"} />
                <Info label="Gender" value={p.gender === Gender.MALE ? "Laki-laki" : "Perempuan"} />
                <Info label="Generasi" value={`Ke-${p.generationNumber || "?"}`} />
                <Info label="Cabang" value={p.familyBranch || "–"} />
                <Info label="Status" value={p.isAlive ? "Masih Hidup" : "Wafat"} />
                <Info label="Tanggal Lahir" value={p.birthDate || "–"} />
                <Info label="Tempat Lahir" value={p.birthPlace || "–"} />
                <Info label="Domisili" value={[p.city, p.province].filter(Boolean).join(", ") || "–"} />
                <Info label="Telepon" value={p.phone || "–"} />
                {!p.isAlive && <Info label="Wafat" value={p.deathDate || "–"} />}
                {!p.isAlive && <Info label="Makam" value={p.graveCity || "–"} />}
                <div className="col-span-2 flex justify-end gap-2 mt-2 pt-3 border-t border-border/50">
                  <Link
                    href={`/admin/anggota/${p.id}/edit`}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
                  >
                    <Edit2 size={12} /> Edit Data
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.fullName)}
                    className="bg-red-500/10 text-red-500 hover:bg-red-500/20 py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <Trash size={12} /> Hapus
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}</span>
      <p className="text-foreground font-medium">{value}</p>
    </div>
  );
}
