"use client";

import { useState, useEffect } from "react";
import { fetchSubmissions } from "@/lib/api";
import { PersonSubmission, DataStatus, ChangeType } from "@/lib/types";
import { Clock, Check, X, FileText } from "lucide-react";

export default function RiwayatPage() {
  const [subs, setSubs] = useState<PersonSubmission[]>([]);
  useEffect(() => {
    fetchSubmissions({ userId: "u2" }).then(setSubs);
  }, []);

  return (
    <div className="max-w-3xl animate-fade-in">
      <h1 className="text-xl font-bold mb-1">Riwayat Submisi</h1>
      <p className="text-sm text-muted mb-6">Daftar semua data yang pernah Anda submisi.</p>

      {subs.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <FileText size={40} className="text-muted mx-auto mb-3" />
          <p className="font-semibold mb-1">Belum Ada Riwayat</p>
          <p className="text-sm text-muted">Data yang Anda submisi akan muncul di sini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map((s) => {
            const data = s.personData as Record<string, unknown>;
            const badge = {
              [DataStatus.PENDING]: { bg: "var(--warning-bg)", color: "var(--warning)", label: "Menunggu", icon: Clock },
              [DataStatus.APPROVED]: { bg: "var(--success-bg)", color: "var(--success)", label: "Disetujui", icon: Check },
              [DataStatus.REJECTED]: { bg: "var(--danger-bg)", color: "var(--danger)", label: "Ditolak", icon: X },
            }[s.status];
            return (
              <div key={s.id} className="glass rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        s.changeType === ChangeType.ADD ? "bg-gold-muted text-gold-light" : "bg-[var(--info-bg)] text-[var(--info)]"
                      }`}>
                        {s.changeType === ChangeType.ADD ? "TAMBAH" : "EDIT"}
                      </span>
                      <span className="text-sm font-semibold">{data.fullName as string || s.targetPersonName}</span>
                    </div>
                    <p className="text-[10px] text-muted">
                      {new Date(s.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium" style={{ background: badge.bg, color: badge.color }}>
                    <badge.icon size={10} /> {badge.label}
                  </span>
                </div>

                {/* Data preview */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {Object.entries(data).slice(0, 6).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-muted-foreground">{k}: </span>
                      <span className="text-foreground">{String(v ?? "-")}</span>
                    </div>
                  ))}
                </div>

                {s.adminNote && (
                  <div className="mt-3 px-3 py-2 rounded-lg bg-white/5 text-xs text-muted">
                    <span className="font-medium text-foreground">Admin: </span>{s.adminNote}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
