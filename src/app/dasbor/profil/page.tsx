"use client";

import { useAppStore } from "@/lib/store";
import { User, Mail, Phone, Users, CheckCircle, Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchPersons, claimProfile } from "@/lib/api";
import { Person } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const { currentUser } = useAppStore();
  const [persons, setPersons] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (search.length > 2) {
      fetchPersons({ search }).then(setPersons);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPersons([]);
    }
  }, [search]);

  if (!currentUser) {
    return <div className="text-center text-muted py-20">Silakan masuk terlebih dahulu.</div>;
  }

  const handleClaim = async (personId: string) => {
    if (!confirm("Apakah Anda yakin ingin mengklaim profil ini sebagai Anda?")) return;
    
    setClaimingId(personId);
    try {
      const success = await claimProfile(personId);
      if (success) {
        alert("Profil berhasil diklaim! Silakan login ulang untuk melihat perubahan (jika data belum sinkron).");
        // Update di UI bisa dilakukan dengan me-refresh halaman atau fetching ulang user
        router.refresh();
      } else {
        alert("Gagal mengklaim profil.");
      }
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="text-xl font-bold mb-6">Profil Saya</h1>

      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-background text-2xl font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold">{currentUser.name}</h2>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gold-muted text-gold-light mt-1">
              {currentUser.role}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <InfoRow icon={Mail} label="Email" value={currentUser.email} />
          <InfoRow icon={Phone} label="WhatsApp" value={currentUser.phone || "-"} />
          <InfoRow icon={Users} label="Nama Ayah" value={currentUser.fatherName || "-"} />
          <InfoRow icon={Users} label="Nama Ibu" value={currentUser.motherName || "-"} />
        </div>
      </div>

      {!currentUser.linkedPersonId && (
        <div className="glass rounded-2xl p-6 border border-gold/30 mb-6">
          <h3 className="text-sm font-semibold text-gold-light mb-2">Klaim Profil di Pohon Keluarga</h3>
          <p className="text-xs text-muted mb-4">
            Akun Anda belum tertaut dengan data di pohon keluarga. Cari nama Anda di bawah ini untuk menautkan.
          </p>
          
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-3 text-muted" />
            <input
              type="text"
              placeholder="Cari nama Anda..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-gold/50"
            />
          </div>

          {persons.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {persons.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-gold/30 transition-colors">
                  <div>
                    <p className="text-sm font-semibold">{p.fullName}</p>
                    <p className="text-[11px] text-muted">Gen {p.generationNumber || "?"} · {p.familyBranch || "-"}</p>
                  </div>
                  <button
                    onClick={() => handleClaim(p.id)}
                    disabled={claimingId === p.id}
                    className="btn-primary py-1.5 px-3 text-xs flex items-center gap-2"
                  >
                    {claimingId === p.id ? <Loader2 size={12} className="animate-spin" /> : "Klaim Ini Saya"}
                  </button>
                </div>
              ))}
            </div>
          )}
          {search.length > 2 && persons.length === 0 && (
            <p className="text-xs text-center text-muted py-4">Data tidak ditemukan.</p>
          )}
        </div>
      )}

      {currentUser.linkedPersonId && (
        <div className="glass rounded-2xl p-4 mb-6 flex items-center gap-3 border border-green-500/30 bg-green-500/5">
          <CheckCircle size={24} className="text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-500">Profil Tertaut</p>
            <p className="text-[11px] text-muted">Akun Anda sudah terhubung dengan data di pohon keluarga.</p>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gold-light mb-4">Edit Profil</h3>
        <form className="space-y-4">
          <Field label="Nama Lengkap" defaultValue={currentUser.name} />
          <Field label="Nomor WhatsApp" defaultValue={currentUser.phone || ""} />
          <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-gold to-gold-dark text-background hover:brightness-110 transition-all">
            Simpan Perubahan
          </button>
        </form>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={15} className="text-muted" />
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue?: string | null }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1.5">{label}</label>
      <input type="text" defaultValue={defaultValue ?? undefined}
        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-gold/50 transition-colors" />
    </div>
  );
}
