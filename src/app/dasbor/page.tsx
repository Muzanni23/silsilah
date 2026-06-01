"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchStats, fetchSubmissions } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { DataStatus, PersonSubmission } from "@/lib/types";
import {
  Users, Plus, Clock, CheckCircle, FileText, TreePine, Map, ShieldAlert
} from "lucide-react";

export default function DasborPage() {
  const { currentUser, checkSession } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [mySubs, setMySubs] = useState<PersonSubmission[]>([]);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [bootstrapMsg, setBootstrapMsg] = useState("");

  useEffect(() => {
    fetchStats().then(setStats).catch(() => setStats({ totalAnggota: 0, masihHidup: 0, wafat: 0, orphanCount: 0 }));
    if (currentUser?.id) {
      fetchSubmissions({ userId: currentUser.id }).then(setMySubs).catch(() => {});
    }
  }, [currentUser?.id]);

  const handleBootstrap = async () => {
    setBootstrapping(true);
    setBootstrapMsg("");
    try {
      const res = await fetch("/api/admin/bootstrap", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setBootstrapMsg("✅ " + (data.message || "Akun berhasil diaktifkan sebagai Super Admin!"));
        // Refresh session
        await checkSession();
        window.location.reload();
      } else {
        setBootstrapMsg("❌ " + (data.error || "Gagal mengaktifkan admin."));
      }
    } catch {
      setBootstrapMsg("❌ Gagal terhubung ke server.");
    } finally {
      setBootstrapping(false);
    }
  };

  if (!stats) return <div className="p-8 text-center text-muted">Memuat Dasbor...</div>;

  // Submisi milik user ini
  const myPending = mySubs.filter((s) => s.status === DataStatus.PENDING).length;
  const myApproved = mySubs.filter((s) => s.status === DataStatus.APPROVED).length;

  // Check if user needs activation
  const needsActivation = currentUser && currentUser.status !== "ACTIVE";

  return (
    <div className="max-w-4xl animate-fade-in">
      {/* Bootstrap Admin Banner */}
      {needsActivation && (
        <div className="mb-6 glass rounded-xl p-5 border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <ShieldAlert size={22} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-500 mb-1">Akun Belum Diaktifkan</h3>
              <p className="text-xs text-muted mb-3">
                Akun Anda berstatus <span className="font-semibold text-amber-400">{currentUser.status}</span>. 
                Anda tidak dapat mengedit data atau mengelola anggota sampai akun diaktifkan.
                {" "}Jika Anda adalah admin pertama, klik tombol di bawah untuk mengaktifkan akun secara otomatis.
              </p>
              <button
                onClick={handleBootstrap}
                disabled={bootstrapping}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-gold to-gold-dark text-background hover:brightness-110 transition-all disabled:opacity-60"
              >
                {bootstrapping ? "Mengaktifkan..." : "🚀 Aktifkan Sebagai Super Admin"}
              </button>
              {bootstrapMsg && (
                <p className={`text-xs mt-2 ${bootstrapMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
                  {bootstrapMsg}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <h1 className="text-xl font-bold mb-1">Selamat Datang, {currentUser?.name || "Anggota"}!</h1>
      <p className="text-sm text-muted mb-6">Kelola kontribusi data silsilah keluarga Anda.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users} label="Total Anggota" value={stats.totalAnggota} color="#60a5fa" />
        <StatCard icon={FileText} label="Submisi Saya" value={mySubs.length} color="#a78bfa" />
        <StatCard icon={Clock} label="Menunggu" value={myPending} color="#f59e0b" />
        <StatCard icon={CheckCircle} label="Disetujui" value={myApproved} color="#22c55e" />
      </div>

      {/* Quick Actions */}
      <h3 className="text-sm font-semibold mb-3">Aksi Cepat</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Link href="/dasbor/tambah" className="glass rounded-xl p-5 hover:bg-white/5 transition-colors group">
          <Plus size={22} className="text-gold-light mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-sm font-semibold">Tambah Anggota</p>
          <p className="text-[11px] text-muted">Submit data keluarga baru</p>
        </Link>
        <Link href="/pohon" className="glass rounded-xl p-5 hover:bg-white/5 transition-colors group">
          <TreePine size={22} className="text-[var(--info)] mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-sm font-semibold">Lihat Pohon</p>
          <p className="text-[11px] text-muted">Jelajahi pohon keluarga</p>
        </Link>
        <Link href="/peta" className="glass rounded-xl p-5 hover:bg-white/5 transition-colors group">
          <Map size={22} className="text-[var(--success)] mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-sm font-semibold">Peta Sebaran</p>
          <p className="text-[11px] text-muted">Lihat lokasi anggota</p>
        </Link>
      </div>

      {/* Recent submissions */}
      <h3 className="text-sm font-semibold mb-3">Submisi Terakhir</h3>
      {mySubs.length === 0 ? (
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-sm text-muted">Belum ada submisi data.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mySubs.slice(0, 5).map((s) => {
            const data = s.personData as Record<string, unknown>;
            const badge = {
              [DataStatus.PENDING]: { bg: "var(--warning-bg)", color: "var(--warning)", label: "Menunggu" },
              [DataStatus.APPROVED]: { bg: "var(--success-bg)", color: "var(--success)", label: "Disetujui" },
              [DataStatus.REJECTED]: { bg: "var(--danger-bg)", color: "var(--danger)", label: "Ditolak" },
            }[s.status];
            return (
              <div key={s.id} className="glass rounded-xl px-5 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{data.fullName as string || s.targetPersonName}</p>
                  <p className="text-[10px] text-muted">
                    {s.changeType === "ADD" ? "Tambah" : "Edit"} · {new Date(s.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: badge.bg, color: badge.color }}>
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <Icon size={18} style={{ color }} className="mb-1.5" />
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}
