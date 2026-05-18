"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { fetchPersons } from "@/lib/api";
import { Person, Gender } from "@/lib/types";
import { Search, X, MapPin, TreePine, User } from "lucide-react";
import Link from "next/link";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [persons, setPersons] = useState<Person[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPersons().then(setPersons);
  }, []);

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return persons
      .filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.nickname?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.familyBranch?.toLowerCase().includes(q) ||
          p.fatherNameFallback?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground hover:border-gold/30 transition-all"
      >
        <Search size={13} />
        <span className="hidden sm:inline">Cari anggota...</span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] bg-white/5 border border-border font-mono ml-2">
          Ctrl+K
        </kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={() => { setOpen(false); setQuery(""); }}
      />

      {/* Search Modal */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 animate-fade-in-scale">
        <div className="glass rounded-2xl border border-border shadow-2xl overflow-hidden mx-4">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search size={18} className="text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, kota, cabang keluarga..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
            <button onClick={() => { setOpen(false); setQuery(""); }} className="text-muted hover:text-foreground shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {query.length < 2 ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                Ketik minimal 2 karakter untuk mencari...
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                Tidak ditemukan hasil untuk &quot;{query}&quot;
              </div>
            ) : (
              <div className="py-1">
                {results.map((p) => (
                  <Link
                    key={p.id}
                    href={`/pohon?focus=${p.id}`}
                    onClick={() => { setOpen(false); setQuery(""); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      p.gender === Gender.MALE ? "text-male bg-male/10" : "text-female bg-female/10"
                    }`}>
                      {p.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.fullName}</p>
                      <p className="text-[10px] text-muted truncate">
                        Gen {p.generationNumber} · {p.familyBranch || "–"}
                        {p.city && ` · ${p.city}`}
                      </p>
                    </div>
                    {p.isAlive ? (
                      <span className="text-[9px] text-[var(--success)]">Hidup</span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground">Wafat</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>↵ Enter untuk buka</span>
            <span>Esc untuk tutup</span>
          </div>
        </div>
      </div>
    </>
  );
}
