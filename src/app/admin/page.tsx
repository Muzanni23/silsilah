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
  const chartData = [3, 2, 3, 1, 2, 3, 1, 1, 2, 2, 1, 1];

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
          <h3 className="text-sm font-semibold">Pertumbuhan Data (2024)</h3>
          <TrendingUp size={16} className="text-gold-light" />
        </div>
        <div className="flex items-end gap-2 h-28">
          {chartData.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-gold-dark to-gold-light"
                style={{ height: `${v * 25}%`, minHeight: 4 }}
              />
              <span className="text-[9px] text-muted-foreground">{months[i]}</span>
            </div>
          ))}
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
