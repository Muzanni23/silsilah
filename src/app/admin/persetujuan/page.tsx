"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchSubmissions, reviewSubmission, fetchPersonById } from "@/lib/api";
import { PersonSubmission, DataStatus, ChangeType, Person } from "@/lib/types";
import { Check, X, ChevronDown, ChevronUp, Eye, Clock, User, ArrowRight } from "lucide-react";

export default function PersetujuanPage() {
  const [subs, setSubs] = useState<PersonSubmission[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("PENDING");

  useEffect(() => {
    fetchSubmissions({ status: filter !== "ALL" ? filter : undefined }).then(setSubs);
  }, [filter]);

  const handleReview = async (id: string, action: "APPROVED" | "REJECTED") => {
    setProcessing(id);
    const ok = await reviewSubmission(id, action);
    if (ok) {
      setSubs((prev) => prev.map((s) => s.id === id ? { ...s, status: action as DataStatus, reviewedAt: new Date().toISOString() } : s));
    }
    setProcessing(null);
  };

  return (
    <div className="max-w-4xl animate-fade-in">
      <h1 className="text-xl font-bold mb-1">Persetujuan Submisi</h1>
      <p className="text-sm text-muted mb-4">Tinjau dan setujui/tolak data yang disubmisi oleh member.</p>

      {/* Filter */}
      <div className="flex gap-1.5 mb-5">
        {[
          { key: "PENDING", label: "Menunggu", color: "var(--warning)" },
          { key: "APPROVED", label: "Disetujui", color: "var(--success)" },
          { key: "REJECTED", label: "Ditolak", color: "var(--danger)" },
          { key: "ALL", label: "Semua", color: "var(--info)" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.key
                ? "text-foreground"
                : "text-muted hover:text-foreground hover:bg-white/5"
            }`}
            style={filter === f.key ? { background: `color-mix(in srgb, ${f.color} 20%, transparent)`, color: f.color } : {}}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {subs.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Clock size={36} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">Tidak ada submisi {filter !== "ALL" ? `dengan status "${filter}"` : ""}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map((sub) => (
            <SubmissionCard
              key={sub.id}
              sub={sub}
              expanded={expandedId === sub.id}
              onToggle={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
              onReview={handleReview}
              processing={processing === sub.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionCard({
  sub, expanded, onToggle, onReview, processing,
}: {
  sub: PersonSubmission;
  expanded: boolean;
  onToggle: () => void;
  onReview: (id: string, action: "APPROVED" | "REJECTED") => void;
  processing: boolean;
}) {
  const data = sub.personData as Record<string, unknown>;
  const isEdit = sub.changeType === ChangeType.EDIT;
  const [existingPerson, setExistingPerson] = useState<Person | null>(null);

  useEffect(() => {
    if (isEdit && sub.targetPersonId) {
      fetchPersonById(sub.targetPersonId).then(setExistingPerson);
    }
  }, [isEdit, sub.targetPersonId]);

  const statusBadge = {
    [DataStatus.PENDING]: { bg: "var(--warning-bg)", color: "var(--warning)", label: "Menunggu" },
    [DataStatus.APPROVED]: { bg: "var(--success-bg)", color: "var(--success)", label: "Disetujui" },
    [DataStatus.REJECTED]: { bg: "var(--danger-bg)", color: "var(--danger)", label: "Ditolak" },
  }[sub.status];

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header */}
      <button onClick={onToggle} className="w-full px-5 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${isEdit ? "bg-[var(--info-bg)] text-[var(--info)]" : "bg-gold-muted text-gold-light"}`}>
              {isEdit ? "EDIT" : "TAMBAH"}
            </span>
            <span className="text-sm font-semibold truncate">{data.fullName as string || sub.targetPersonName}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <User size={11} />
            <span>{sub.submittedByName}</span>
            <span>·</span>
            <span>{new Date(sub.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-medium" style={{ background: statusBadge.bg, color: statusBadge.color }}>
          {statusBadge.label}
        </span>
        {expanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
      </button>

      {/* Expanded: Diff View + Actions */}
      {expanded && (
        <div className="border-t border-border px-5 py-4 animate-fade-in">
          {/* Diff View */}
          {isEdit && existingPerson ? (
            <DiffView existing={existingPerson as unknown as Record<string, unknown>} incoming={data} />
          ) : (
            <DataView data={data} />
          )}

          {/* Review Note */}
          {sub.adminNote && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-white/5 text-xs text-muted">
              <span className="font-medium text-foreground">Catatan Admin: </span>{sub.adminNote}
            </div>
          )}

          {/* Actions */}
          {sub.status === DataStatus.PENDING && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-border">
              <button
                onClick={() => onReview(sub.id, "APPROVED")}
                disabled={processing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--success-bg)] text-[var(--success)] hover:brightness-125 transition-all disabled:opacity-50"
              >
                <Check size={14} /> Setujui
              </button>
              <button
                onClick={() => onReview(sub.id, "REJECTED")}
                disabled={processing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--danger-bg)] text-danger hover:brightness-125 transition-all disabled:opacity-50"
              >
                <X size={14} /> Tolak
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Side-by-side diff view untuk EDIT
function DiffView({ existing, incoming }: { existing: Record<string, unknown>; incoming: Record<string, unknown> }) {
  const fields = Object.keys(incoming).filter((k) => k !== "id" && k !== "createdAt" && k !== "updatedAt");

  return (
    <div>
      <p className="text-xs font-medium text-muted mb-2">Perbandingan Data Lama vs Baru:</p>
      <div className="rounded-xl overflow-hidden border border-border">
        <div className="grid grid-cols-[1fr_2fr_auto_2fr] text-[10px] font-semibold text-muted uppercase tracking-wide px-3 py-2 bg-white/5">
          <span>Field</span>
          <span>Data Lama</span>
          <span></span>
          <span>Data Baru</span>
        </div>
        {fields.map((key) => {
          const oldVal = String(existing[key] ?? "-");
          const newVal = String(incoming[key] ?? "-");
          const changed = oldVal !== newVal;
          return (
            <div key={key} className={`grid grid-cols-[1fr_2fr_auto_2fr] text-xs px-3 py-2 border-t border-border ${changed ? "bg-[var(--warning-bg)]" : ""}`}>
              <span className="text-muted font-medium">{key}</span>
              <span className={changed ? "line-through text-muted-foreground" : "text-muted"}>{oldVal}</span>
              <span className="px-2">{changed ? <ArrowRight size={12} className="text-[var(--warning)]" /> : null}</span>
              <span className={changed ? "text-foreground font-medium" : "text-muted"}>{newVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Simple data view untuk ADD
function DataView({ data }: { data: Record<string, unknown> }) {
  const fields = Object.entries(data).filter(([k]) => k !== "id" && k !== "createdAt" && k !== "updatedAt");

  return (
    <div>
      <p className="text-xs font-medium text-muted mb-2">Data yang disubmisi:</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {fields.map(([key, val]) => (
          <div key={key} className="flex gap-2 text-xs">
            <span className="text-muted font-medium min-w-20">{key}:</span>
            <span className="text-foreground">{String(val ?? "-")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
