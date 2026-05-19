"use client";

import { Person, Gender, Marriage } from "@/lib/types";
import {
  X, Calendar, MapPin, Phone, Users, ExternalLink,
  Flower2, Navigation, MessageCircle, Edit, Trash
} from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { deletePerson } from "@/lib/api";

interface Props {
  person: Person;
  allPersons: Person[];
  allMarriages: Marriage[];
  onClose: () => void;
}

function getChildrenOf(personId: string, allPersons: Person[]): Person[] {
  return allPersons.filter((p) => p.fatherId === personId || p.motherId === personId);
}

function getSpousesOf(personId: string, allPersons: Person[], allMarriages: Marriage[]): Person[] {
  const spouseIds = new Set<string>();
  allMarriages.forEach((m) => {
    if (m.husbandId === personId) spouseIds.add(m.wifeId);
    if (m.wifeId === personId) spouseIds.add(m.husbandId);
  });
  return allPersons.filter((p) => spouseIds.has(p.id));
}

export default function PersonSidebar({ person, allPersons, allMarriages, onClose }: Props) {
  const children = getChildrenOf(person.id, allPersons);
  const spouses = getSpousesOf(person.id, allPersons, allMarriages);
  const genderColor = person.gender === Gender.MALE ? "#60a5fa" : "#f472b6";
  const initials = person.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const { currentUser } = useAppStore();
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";

  const handleDelete = async () => {
    if (window.confirm(`Yakin ingin menghapus ${person.fullName} dari silsilah? Data tidak dapat dikembalikan.`)) {
      const success = await deletePerson(person.id);
      if (success) {
        window.location.reload();
      }
    }
  };

  return (
    <div className="w-full sm:w-80 absolute md:relative right-0 top-0 bottom-0 z-30 h-full border-l border-border bg-card/95 backdrop-blur-md overflow-y-auto animate-slide-in-right flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-5 border-b border-border relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/5 text-muted hover:text-foreground transition-colors flex items-center gap-1 text-[10px]"
          title="Tutup"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold mb-3"
            style={{
              background: person.isAlive
                ? `linear-gradient(135deg, ${genderColor}25, ${genderColor}10)`
                : "rgba(107,114,128,0.15)",
              color: person.isAlive ? genderColor : "#6b7280",
            }}
          >
            {initials}
          </div>

          <h3 className="text-lg font-bold">{person.fullName}</h3>
          {person.nickname && (
            <p className="text-sm text-muted">({person.nickname})</p>
          )}

          {/* Badge */}
          <span
            className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-medium ${
              person.isAlive
                ? "bg-[var(--success-bg)] text-[var(--success)]"
                : "bg-white/5 text-muted"
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: person.isAlive ? "#22c55e" : "#6b7280" }}
            />
            {person.isAlive ? "Masih Hidup" : "Wafat"}
          </span>

          {person.generationNumber && (
            <p className="text-xs text-muted mt-1.5">
              Generasi ke-{person.generationNumber}
              {person.familyBranch && ` · ${person.familyBranch}`}
            </p>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-5 space-y-4 flex-1">
        {/* Tanggal Lahir */}
        {(person.birthDate || person.birthPlace) && (
          <InfoRow icon={Calendar} label="Lahir">
            {person.birthDate && formatDate(person.birthDate)}
            {person.birthPlace && `, ${person.birthPlace}`}
          </InfoRow>
        )}

        {/* Tanggal Wafat */}
        {person.deathDate && (
          <InfoRow icon={Calendar} label="Wafat">
            {formatDate(person.deathDate)}
            {person.deathPlace && `, ${person.deathPlace}`}
          </InfoRow>
        )}

        {/* Domisili (Lengkap) */}
        {(person.address || person.kelurahan || person.kecamatan || person.kabupaten || person.province || person.city) && (
          <InfoRow icon={MapPin} label="Domisili">
            {[
              person.address,
              person.kelurahan ? `Kel. ${person.kelurahan}` : null,
              person.kecamatan ? `Kec. ${person.kecamatan}` : null,
              person.kabupaten || person.city,
              person.province
            ]
              .filter(Boolean)
              .join(", ")}
          </InfoRow>
        )}

        {/* Pasangan */}
        {spouses.length > 0 && (
          <InfoRow icon={Users} label="Pasangan">
            <div className="flex flex-col gap-1 mt-1">
              {spouses.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-border/40 text-xs font-medium text-foreground w-fit"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: s.gender === Gender.MALE ? "#60a5fa" : "#f472b6" }}
                  />
                  {s.fullName} {s.nickname && `(${s.nickname})`}
                </span>
              ))}
            </div>
          </InfoRow>
        )}

        {/* Anak */}
        <InfoRow icon={Users} label="Anak">
          {children.length > 0 ? (
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-xs text-muted mb-1">{children.length} Anak Terdaftar:</p>
              <div className="flex flex-wrap gap-1">
                {children.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-muted border border-border/20"
                  >
                    {c.fullName}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            "Belum ada data"
          )}
        </InfoRow>
      </div>

      {/* Actions */}
      <div className="p-5 border-t border-border space-y-2">
        {isAdmin && (
          <div className="flex gap-2 mb-4">
            <Link
              href={`/admin/anggota/${person.id}/edit`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-gold to-gold-dark text-background hover:brightness-110 transition-all"
            >
              <Edit size={15} />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
            >
              <Trash size={15} />
              Hapus
            </button>
          </div>
        )}
        
        {person.isAlive && person.latitude && person.longitude && (
          <Link
            href={`/peta?lat=${person.latitude}&lng=${person.longitude}&name=${encodeURIComponent(person.fullName)}`}
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--info-bg)] text-[var(--info)] hover:brightness-125 transition-all"
          >
            <Navigation size={15} />
            Lihat di Peta
          </Link>
        )}

        {person.isAlive && person.phone && (
          <a
            href={`https://wa.me/${person.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--success-bg)] text-[var(--success)] hover:brightness-125 transition-all"
          >
            <MessageCircle size={15} />
            Hubungi via WhatsApp
          </a>
        )}

        {!person.isAlive && person.graveLatitude && person.graveLongitude && (
          <Link
            href={`/peta?tab=makam&lat=${person.graveLatitude}&lng=${person.graveLongitude}&name=${encodeURIComponent(person.fullName)}`}
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-muted hover:text-foreground hover:bg-white/10 transition-all"
          >
            <Flower2 size={15} />
            Lihat Lokasi Makam
          </Link>
        )}

        {/* Prominent Close Button at bottom */}
        <button
          onClick={onClose}
          className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border text-muted hover:text-foreground hover:bg-white/5 transition-all mt-2"
        >
          <X size={15} />
          Tutup Detail
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon size={15} className="text-muted shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className="text-sm text-foreground break-words">{children}</div>
      </div>
    </div>
  );
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return d;
  }
}
