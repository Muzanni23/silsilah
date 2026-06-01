"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchStats } from "@/lib/api";
import {
  Users, CheckCircle, Clock, UserPlus, Link2, User,
  FileText, AlertTriangle, TrendingUp,
} from "lucide-react";

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats().then(setStats);
  }, []);

  if (!stats) return <div className="p-8 text-center text-muted">Memuat Dasbor Admin...</div>;

  const cards = [
    { label: "Total Anggota", value: stats.totalAnggota, icon: Users, color: "#60a5fa" },
    { label: "Masih Hidup", value: stats.masihHidup, icon: CheckCircle, color: "#22c55e" },
    { label: "Submisi Pending", value: stats.pendingSubmissions, icon: Clock, color: "#f59e0b" },
    { label: "User Pending", value: stats.pendingUsers, icon: UserPlus, color: "#8b5cf6" },
    { label: "Orphan Nodes", value: stats.orphanCount, icon: Link2, color: "#ef4444" },
    { label: "Total User", value: stats.totalUsers, icon: User, color: "#06b6d4" },
  ];

  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const chartData = stats.growthStats || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const maxVal = Math.max(...chartData, 1);

  return (
    <div className="max-w-5xl animate-fade-in">
      <h1 className="text-xl font-bold mb-1">Dasbor Admin</h1>
      <p className="text-sm text-muted mb-6">Pantau dan kelola data silsilah keluarga.</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-xl p-5">
            <c.icon size={20} style={{ color: c.color }} className="mb-2" />
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Pertumbuhan Data ({new Date().getFullYear()})</h3>
          <TrendingUp size={16} className="text-gold-light" />
        </div>
        <div className="flex items-end gap-2 h-28">
          {chartData.map((v: number, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-gold-dark to-gold-light transition-all duration-300 hover:brightness-110"
                style={{ height: `${(v / maxVal) * 100}%`, minHeight: 4 }}
                title={`${months[i]}: ${v} anggota baru`}
              />
              <span className="text-[9px] text-muted-foreground">{months[i]}</span>
              {/* Dynamic tooltip on hover */}
              {v > 0 && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black/85 border border-gold/30 px-2 py-0.5 rounded text-[8px] text-gold-light opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-semibold">
                  +{v}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Demographic Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Persebaran per Generasi */}
        <div className="glass rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gradient-gold">Persebaran per Generasi</h3>
            <div className="space-y-4">
              {stats.generationStats && stats.generationStats.length > 0 ? (
                stats.generationStats.map((g: any) => {
                  const total = stats.totalAnggota || 1;
                  const percent = Math.round((g.count / total) * 100);
                  return (
                    <div key={g.generation} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-foreground-light">Generasi {g.generation}</span>
                        <span className="text-gold-light">{g.count} orang ({percent}%)</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-gold to-gold-light h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted py-4 text-center">Belum ada data generasi</p>
              )}
            </div>
          </div>
        </div>

        {/* Top 5 Kota Domisili */}
        <div className="glass rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gradient-gold">5 Kota Domisili Terbanyak</h3>
            <div className="space-y-3">
              {stats.cityStats && stats.cityStats.length > 0 ? (
                stats.cityStats.map((c: any, index: number) => {
                  const aliveTotal = stats.masihHidup || 1;
                  const percent = Math.round((c.count / aliveTotal) * 100);
                  const colors = ["bg-gold", "bg-gold-light", "bg-yellow-600/80", "bg-yellow-700/60", "bg-yellow-800/40"];
                  return (
                    <div key={c.city} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] text-background ${colors[index] || "bg-muted"}`}>
                          {index + 1}
                        </span>
                        <span className="font-medium text-foreground">{c.city}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{percent}%</span>
                        <span className="px-2 py-0.5 rounded-md bg-gold-muted text-gold-light font-semibold text-[10px]">
                          {c.count} orang
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted py-4 text-center">Belum ada data domisili</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {stats.pendingSubmissions > 0 && (
          <Link href="/admin/persetujuan" className="glass rounded-xl p-5 border-l-4 border-[var(--warning)] hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-[var(--warning)]" />
              <span className="text-sm font-semibold">{stats.pendingSubmissions} Submisi Menunggu</span>
            </div>
            <p className="text-xs text-muted">Ada submisi data yang perlu ditinjau dan disetujui.</p>
          </Link>
        )}
        {stats.orphanCount > 0 && (
          <Link href="/admin/orphan" className="glass rounded-xl p-5 border-l-4 border-danger hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-danger" />
              <span className="text-sm font-semibold">{stats.orphanCount} Node Tidak Terhubung</span>
            </div>
            <p className="text-xs text-muted">Ada anggota yang belum terhubung ke pohon utama.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
