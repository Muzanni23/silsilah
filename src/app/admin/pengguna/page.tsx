"use client";

import { useState, useEffect } from "react";
import { fetchUsers, manageUser } from "@/lib/api";
import { User, UserStatus, Role } from "@/lib/types";
import { Check, X, Shield, Ban, Clock, UserCheck } from "lucide-react";

export default function PenggunaPage() {
  const [allUsers, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [processing, setProcessing] = useState<string | null>(null);

  const loadUsers = () => {
    fetchUsers(filter !== "ALL" ? { status: filter } : undefined).then(setUsers);
  };
  useEffect(loadUsers, [filter]);

  const handleAction = async (id: string, action: string) => {
    setProcessing(id);
    await manageUser(id, action);
    loadUsers();
    setProcessing(null);
  };

  return (
    <div className="max-w-4xl animate-fade-in">
      <h1 className="text-xl font-bold mb-1">Manajemen Pengguna</h1>
      <p className="text-sm text-muted mb-4">Kelola status dan role pengguna platform.</p>

      <div className="flex gap-1.5 mb-5">
        {[
          { key: "ALL", label: "Semua" },
          { key: "PENDING", label: "Pending" },
          { key: "ACTIVE", label: "Aktif" },
          { key: "SUSPENDED", label: "Ditangguhkan" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.key ? "bg-gold-muted text-gold-light" : "text-muted hover:text-foreground hover:bg-white/5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {allUsers.map((u) => {
          const isPending = u.status === UserStatus.PENDING;
          const isActive = u.status === UserStatus.ACTIVE;
          return (
            <div key={u.id} className="glass rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-background text-sm font-bold shrink-0">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold truncate">{u.name}</p>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gold-muted text-gold-light">
                    {u.role}
                  </span>
                </div>
                <p className="text-[11px] text-muted truncate">{u.email} · Ayah: {u.fatherName} · Ibu: {u.motherName}</p>
              </div>
              <StatusBadge status={u.status} />
              <div className="flex gap-1.5 shrink-0">
                {isPending && (
                  <>
                    <button onClick={() => handleAction(u.id, "approve")} disabled={processing === u.id}
                      className="p-1.5 rounded-lg bg-[var(--success-bg)] text-[var(--success)] hover:brightness-125 transition-all" title="Setujui">
                      <Check size={14} />
                    </button>
                    <button onClick={() => handleAction(u.id, "reject")} disabled={processing === u.id}
                      className="p-1.5 rounded-lg bg-[var(--danger-bg)] text-danger hover:brightness-125 transition-all" title="Tolak">
                      <X size={14} />
                    </button>
                  </>
                )}
                {isActive && u.role !== Role.SUPER_ADMIN && (
                  <button onClick={() => handleAction(u.id, "suspend")} disabled={processing === u.id}
                    className="p-1.5 rounded-lg border border-border text-muted hover:text-danger hover:border-danger/30 transition-all" title="Tangguhkan">
                    <Ban size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const map = {
    [UserStatus.PENDING]: { bg: "var(--warning-bg)", color: "var(--warning)", label: "Pending", icon: Clock },
    [UserStatus.ACTIVE]: { bg: "var(--success-bg)", color: "var(--success)", label: "Aktif", icon: UserCheck },
    [UserStatus.SUSPENDED]: { bg: "var(--danger-bg)", color: "var(--danger)", label: "Suspended", icon: Ban },
  };
  const s = map[status];
  return (
    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium" style={{ background: s.bg, color: s.color }}>
      <s.icon size={10} /> {s.label}
    </span>
  );
}
