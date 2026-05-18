"use client";

import { useState, useEffect } from "react";
import { fetchActivityLogs } from "@/lib/api";
import { ActivityLog } from "@/lib/types";
import { User, Clock } from "lucide-react";

export default function AktivitasPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  useEffect(() => { fetchActivityLogs().then(setLogs); }, []);

  return (
    <div className="max-w-4xl animate-fade-in">
      <h1 className="text-xl font-bold mb-1">Log Aktivitas</h1>
      <p className="text-sm text-muted mb-6">Rekam semua aksi yang dilakukan admin dan member.</p>

      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="glass rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-gold-muted flex items-center justify-center shrink-0">
              <User size={16} className="text-gold-light" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-semibold">{log.userName}</span>{" "}
                <span className="text-muted">{log.action}</span>
                {log.target && (
                  <span className="text-foreground font-medium"> — {log.target}</span>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock size={10} />
                {new Date(log.createdAt).toLocaleString("id-ID", {
                  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
