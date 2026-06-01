"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/navbar";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, Flower2 } from "lucide-react";
import { Person } from "@/lib/types";

const FamilyMap = dynamic(() => import("@/components/maps/family-map"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted">Memuat peta...</p>
      </div>
    </div>
  ),
});

export default function PetaClient({ persons }: { persons: Person[] }) {
  const searchParams = useSearchParams();
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");
  const tabParam = searchParams.get("tab") as "domisili" | "makam";

  const [tab, setTab] = useState<"domisili" | "makam">(tabParam || "domisili");
  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(
    latStr && lngStr ? [parseFloat(latStr), parseFloat(lngStr)] : null
  );

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab bar */}
        <div className="border-b border-border px-4 py-2 flex items-center justify-between gap-2 bg-card/50">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("domisili")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "domisili" ? "bg-gold-muted text-gold-light" : "text-muted hover:text-foreground hover:bg-white/5"
              }`}
            >
              <MapPin size={15} />
              Peta Domisili
            </button>
            <button
              onClick={() => setTab("makam")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "makam" ? "bg-gold-muted text-gold-light" : "text-muted hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Flower2 size={15} />
              Peta Makam
            </button>
          </div>
          <button
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => setInitialCenter([pos.coords.latitude, pos.coords.longitude]),
                  (err) => alert("Gagal mendapatkan lokasi: " + err.message)
                );
              } else {
                alert("Browser Anda tidak mendukung fitur Lokasi.");
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <MapPin size={14} /> Lokasi Saya
          </button>
        </div>
        <div className="flex-1 relative">
          <FamilyMap mode={tab} initialCenter={initialCenter} persons={persons} userLocation={initialCenter} />
        </div>
      </div>
    </div>
  );
}
