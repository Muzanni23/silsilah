"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { fetchPersons, fetchPersonById } from "@/lib/api";
import { Gender, Person } from "@/lib/types";
import { MapPin, Search, X, Save } from "lucide-react";
import dynamic from "next/dynamic";
import AddressAutocomplete, { type AddressData } from "@/components/address-autocomplete";

const CoordinatePicker = dynamic(() => import("@/components/coordinate-picker"), { ssr: false });

export interface PersonFormData {
  fullName: string;
  nickname?: string;
  gender: Gender;
  isAlive: boolean;
  birthDate?: string;
  birthPlace?: string;
  phone?: string;
  fatherId?: string;
  spouseId?: string;
  // Domisili
  address?: string;
  kelurahan?: string;
  kecamatan?: string;
  kabupaten?: string;
  province?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  // Wafat / Makam
  deathDate?: string;
  graveAddress?: string;
  graveKelurahan?: string;
  graveKecamatan?: string;
  graveKabupaten?: string;
  graveProvince?: string;
  graveCity?: string;
  graveLatitude?: number;
  graveLongitude?: number;
}

interface Props {
  initialData?: Partial<Person>;
  onSubmit: (data: PersonFormData) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

export default function PersonForm({ initialData, onSubmit, loading, submitLabel = "Simpan Data" }: Props) {
  // Domisili state
  const [domisili, setDomisili] = useState<Partial<AddressData>>({
    jalan: initialData?.address ?? undefined,
    kelurahan: initialData?.kelurahan ?? undefined,
    kecamatan: initialData?.kecamatan ?? undefined,
    kabupaten: (initialData?.kabupaten || initialData?.city) ?? undefined,
    provinsi: initialData?.province ?? undefined,
    latitude: initialData?.latitude ?? undefined,
    longitude: initialData?.longitude ?? undefined,
    displayName: initialData?.address ?? "",
  });
  const [showDomisiliMap, setShowDomisiliMap] = useState(false);
  const [domisiliMapPos, setDomisiliMapPos] = useState<[number, number] | null>(
    initialData?.latitude && initialData?.longitude ? [initialData.latitude, initialData.longitude] : null
  );

  // Makam state
  const [makam, setMakam] = useState<Partial<AddressData>>({
    jalan: initialData?.graveAddress ?? undefined,
    kelurahan: initialData?.graveKelurahan ?? undefined,
    kecamatan: initialData?.graveKecamatan ?? undefined,
    kabupaten: (initialData?.graveKabupaten || initialData?.graveCity) ?? undefined,
    provinsi: initialData?.graveProvince ?? undefined,
    latitude: initialData?.graveLatitude ?? undefined,
    longitude: initialData?.graveLongitude ?? undefined,
    displayName: initialData?.graveAddress ?? "",
  });
  const [showMakamMap, setShowMakamMap] = useState(false);
  const [makamMapPos, setMakamMapPos] = useState<[number, number] | null>(
    initialData?.graveLatitude && initialData?.graveLongitude ? [initialData.graveLatitude, initialData.graveLongitude] : null
  );

  // Parent search
  const [parentSearch, setParentSearch] = useState("");
  const [selectedParent, setSelectedParent] = useState<Person | null>(null);
  const [showParentSearch, setShowParentSearch] = useState(false);
  
  // Spouse search
  const [spouseSearch, setSpouseSearch] = useState("");
  const [selectedSpouse, setSelectedSpouse] = useState<Person | null>(null);
  const [showSpouseSearch, setShowSpouseSearch] = useState(false);
  
  const [isAlive, setIsAlive] = useState<boolean>(
    initialData?.isAlive !== undefined ? initialData.isAlive : true
  );
  
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const [persons, setPersons] = useState<Person[]>([]);

  useEffect(() => {
    fetchPersons().then(setPersons);
  }, []);

  useEffect(() => {
    if (initialData?.fatherId) {
      fetchPersonById(initialData.fatherId).then(parent => {
        if (parent) setSelectedParent(parent);
      });
    }
  }, [initialData?.fatherId]);

  const parentResults = parentSearch
    ? persons.filter((p) => p.fullName.toLowerCase().includes(parentSearch.toLowerCase()) && p.id !== initialData?.id).slice(0, 5)
    : [];

  const spouseResults = spouseSearch
    ? persons.filter((p) => p.fullName.toLowerCase().includes(spouseSearch.toLowerCase()) && p.id !== initialData?.id).slice(0, 5)
    : [];

  const handleDomisiliSelect = useCallback((addr: AddressData) => {
    setDomisili(addr);
    if (addr.latitude !== undefined && addr.longitude !== undefined) {
      setDomisiliMapPos([addr.latitude, addr.longitude]);
    }
  }, []);

  const handleDomisiliMapClick = useCallback(async (lat: number, lng: number) => {
    setDomisili((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    try {
      const res = await fetch(
        `/api/autocomplete?` +
          new URLSearchParams({
            lat: lat.toString(),
            lon: lng.toString(),
          })
      );
      const data = await res.json();
      const a = data.address || {};
      setDomisili({
        jalan: a.road || "",
        kelurahan: a.village || a.suburb || a.neighbourhood || "",
        kecamatan: a.city_district || a.county || "",
        kabupaten: a.city || a.town || a.municipality || "",
        provinsi: a.state || "",
        latitude: lat,
        longitude: lng,
        displayName: data.display_name || `${lat}, ${lng}`,
      });
    } catch {
      setDomisili((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    }
    setShowDomisiliMap(false);
  }, []);

  const handleMakamSelect = useCallback((addr: AddressData) => {
    setMakam(addr);
    if (addr.latitude !== undefined && addr.longitude !== undefined) {
      setMakamMapPos([addr.latitude, addr.longitude]);
    }
  }, []);

  const handleMakamMapClick = useCallback(async (lat: number, lng: number) => {
    setMakam((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    try {
      const res = await fetch(
        `/api/autocomplete?` +
          new URLSearchParams({
            lat: lat.toString(),
            lon: lng.toString(),
          })
      );
      const data = await res.json();
      const a = data.address || {};
      setMakam({
        jalan: a.road || "",
        kelurahan: a.village || a.suburb || a.neighbourhood || "",
        kecamatan: a.city_district || a.county || "",
        kabupaten: a.city || a.town || a.municipality || "",
        provinsi: a.state || "",
        latitude: lat,
        longitude: lng,
        displayName: data.display_name || `${lat}, ${lng}`,
      });
    } catch {
      setMakam((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    }
    setShowMakamMap(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    const form = new FormData(formRef.current!);
    if (!selectedParent) {
      setErrorMsg("Data tidak dapat disimpan. Anda harus memilih orang tua yang sudah ada di database agar silsilah tidak terputus.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    const data: PersonFormData = {
      fullName: form.get("fullName") as string,
      nickname: (form.get("nickname") as string) || undefined,
      gender: form.get("gender") as Gender,
      isAlive: isAlive,
      birthDate: (form.get("birthDate") as string) || undefined,
      birthPlace: (form.get("birthPlace") as string) || undefined,
      phone: (form.get("phone") as string) || undefined,
      fatherId: selectedParent?.id || undefined,
      spouseId: selectedSpouse?.id || undefined,
      
      address: isAlive ? (domisili.jalan || undefined) : undefined,
      kelurahan: isAlive ? (domisili.kelurahan || undefined) : undefined,
      kecamatan: isAlive ? (domisili.kecamatan || undefined) : undefined,
      kabupaten: isAlive ? (domisili.kabupaten || undefined) : undefined,
      province: isAlive ? (domisili.provinsi || undefined) : undefined,
      city: isAlive ? (domisili.kabupaten || undefined) : undefined,
      latitude: isAlive ? (domisili.latitude || undefined) : undefined,
      longitude: isAlive ? (domisili.longitude || undefined) : undefined,
      
      deathDate: !isAlive ? ((form.get("deathDate") as string) || undefined) : undefined,
      graveAddress: !isAlive ? (makam.jalan || undefined) : undefined,
      graveKelurahan: !isAlive ? (makam.kelurahan || undefined) : undefined,
      graveKecamatan: !isAlive ? (makam.kecamatan || undefined) : undefined,
      graveKabupaten: !isAlive ? (makam.kabupaten || undefined) : undefined,
      graveProvince: !isAlive ? (makam.provinsi || undefined) : undefined,
      graveCity: !isAlive ? (makam.kabupaten || undefined) : undefined,
      graveLatitude: !isAlive ? (makam.latitude || undefined) : undefined,
      graveLongitude: !isAlive ? (makam.longitude || undefined) : undefined,
    };

    await onSubmit(data);
  };

  return (
    <div className="relative">
      {errorMsg && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
          {errorMsg}
        </div>
      )}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <Section title="Data Pribadi">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nama Lengkap *" name="fullName" defaultValue={initialData?.fullName} required />
            <Field label="Panggilan" name="nickname" defaultValue={initialData?.nickname || ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Jenis Kelamin *</label>
              <select name="gender" defaultValue={initialData?.gender || ""} required className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-gold/50">
                <option value="">Pilih</option>
                <option value={Gender.MALE}>Laki-laki</option>
                <option value={Gender.FEMALE}>Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Status *</label>
              <select
                name="isAlive"
                value={isAlive ? "true" : "false"}
                onChange={(e) => setIsAlive(e.target.value === "true")}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-gold/50"
              >
                <option value="true">Masih Hidup</option>
                <option value="false">Wafat</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal Lahir" name="birthDate" type="date" defaultValue={initialData?.birthDate?.split("T")[0] || ""} />
            <Field label="Tempat Lahir" name="birthPlace" defaultValue={initialData?.birthPlace || ""} />
          </div>
          <Field label="No. WhatsApp" name="phone" placeholder="628xxxxxxxxxx" defaultValue={initialData?.phone || ""} />
        </Section>

        <Section title="Hubungan Keluarga">
          <div className="relative mb-4">
            <label className="block text-xs font-medium text-muted mb-1.5">Orang Tua (Ayah/Ibu) *</label>
            {selectedParent ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-muted/20 border border-gold/30">
                <span className="text-sm font-medium">{selectedParent.fullName}</span>
                <span className="text-[10px] text-muted">Gen {selectedParent.generationNumber}</span>
                <button type="button" onClick={() => { setSelectedParent(null); setShowParentSearch(true); }} className="ml-auto text-muted hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border">
                  <Search size={14} className="text-muted" />
                  <input type="text" value={parentSearch}
                    onChange={(e) => { setParentSearch(e.target.value); setShowParentSearch(true); }}
                    onFocus={() => setShowParentSearch(true)}
                    placeholder="Ketik nama ayah untuk mencari..."
                    className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1" />
                </div>
                {showParentSearch && parentResults.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full glass rounded-xl border border-border shadow-xl max-h-48 overflow-y-auto">
                    {parentResults.map((p) => (
                      <button key={p.id} type="button"
                        onClick={() => { setSelectedParent(p); setParentSearch(""); setShowParentSearch(false); }}
                        className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 text-left text-sm transition-colors">
                        <span className="font-medium">{p.fullName}</span>
                        <span className="text-[10px] text-muted">Gen {p.generationNumber} · {p.familyBranch}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-muted mb-1.5">Pasangan (Suami/Istri) (Opsional)</label>
            {selectedSpouse ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-muted/20 border border-gold/30">
                <span className="text-sm font-medium">{selectedSpouse.fullName}</span>
                <span className="text-[10px] text-muted">Gen {selectedSpouse.generationNumber}</span>
                <button type="button" onClick={() => { setSelectedSpouse(null); setShowSpouseSearch(true); }} className="ml-auto text-muted hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border">
                  <Search size={14} className="text-muted" />
                  <input type="text" value={spouseSearch}
                    onChange={(e) => { setSpouseSearch(e.target.value); setShowSpouseSearch(true); }}
                    onFocus={() => setShowSpouseSearch(true)}
                    placeholder="Ketik nama pasangan untuk mencari..."
                    className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1" />
                </div>
                {showSpouseSearch && spouseResults.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full glass rounded-xl border border-border shadow-xl max-h-48 overflow-y-auto">
                    {spouseResults.map((p) => (
                      <button key={p.id} type="button"
                        onClick={() => { setSelectedSpouse(p); setSpouseSearch(""); setShowSpouseSearch(false); }}
                        className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 text-left text-sm transition-colors">
                        <span className="font-medium">{p.fullName}</span>
                        <span className="text-[10px] text-muted">Gen {p.generationNumber} · {p.familyBranch}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>

        {isAlive && (
          <Section title="Domisili">
            <AddressAutocomplete
              label="Cari Alamat Domisili"
              onSelect={handleDomisiliSelect}
              initialAddress={domisili as AddressData}
            />

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">Latitude</label>
                <input type="text" readOnly value={domisili.latitude?.toFixed(6) || ""}
                  placeholder="Auto dari alamat/peta"
                  className="w-full px-3.5 py-2 rounded-lg bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground cursor-default" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">Longitude</label>
                <input type="text" readOnly value={domisili.longitude?.toFixed(6) || ""}
                  placeholder="Auto dari alamat/peta"
                  className="w-full px-3.5 py-2 rounded-lg bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground cursor-default" />
              </div>
            </div>
            <button type="button" onClick={() => setShowDomisiliMap(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-border hover:bg-white/5 hover:border-gold/30 transition-all mt-1">
              <MapPin size={13} className="text-gold-light" /> Pilih / Koreksi Titik di Peta
            </button>
          </Section>
        )}

        {!isAlive && (
          <Section title="Data Wafat (jika sudah wafat)">
            <Field label="Tanggal Wafat" name="deathDate" type="date" defaultValue={initialData?.deathDate?.split("T")[0] || ""} />

            <AddressAutocomplete
              label="Cari Lokasi Makam"
              onSelect={handleMakamSelect}
              initialAddress={makam as AddressData}
            />

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">Lat Makam</label>
                <input type="text" readOnly value={makam.latitude?.toFixed(6) || ""}
                  placeholder="Auto dari alamat/peta"
                  className="w-full px-3.5 py-2 rounded-lg bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground cursor-default" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">Lng Makam</label>
                <input type="text" readOnly value={makam.longitude?.toFixed(6) || ""}
                  placeholder="Auto dari alamat/peta"
                  className="w-full px-3.5 py-2 rounded-lg bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground cursor-default" />
              </div>
            </div>
            <button type="button" onClick={() => setShowMakamMap(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-border hover:bg-white/5 hover:border-gold/30 transition-all mt-1">
              <MapPin size={13} className="text-gold-light" /> Pilih / Koreksi Titik Makam di Peta
            </button>
          </Section>
        )}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-gold to-gold-dark text-background hover:brightness-110 transition-all disabled:opacity-60">
          {loading ? <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
          {loading ? "Menyimpan..." : submitLabel}
        </button>
      </form>

      {showDomisiliMap && (
        <MapModal
          title="Pilih Titik Domisili"
          onClose={() => setShowDomisiliMap(false)}
          onSelect={handleDomisiliMapClick}
          initialLat={domisili.latitude}
          initialLng={domisili.longitude}
          externalPos={domisiliMapPos}
        />
      )}

      {showMakamMap && (
        <MapModal
          title="Pilih Titik Makam"
          onClose={() => setShowMakamMap(false)}
          onSelect={handleMakamMapClick}
          initialLat={makam.latitude}
          initialLng={makam.longitude}
          externalPos={makamMapPos}
        />
      )}
    </div>
  );
}

function MapModal({
  title, onClose, onSelect, initialLat, initialLng, externalPos,
}: {
  title: string;
  onClose: () => void;
  onSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  externalPos?: [number, number] | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MapPin size={15} className="text-gold-light" />
            {title}
          </h3>
          <button onClick={onClose} type="button" className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <div className="h-[420px]">
          <CoordinatePicker
            onSelect={onSelect}
            initialLat={initialLat}
            initialLng={initialLng}
            externalPos={externalPos}
          />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gold-light mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, name, type = "text", placeholder, required, defaultValue }: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean; defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1.5">{label}</label>
      <input type={type} name={name} placeholder={placeholder} required={required} defaultValue={defaultValue}
        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors" />
    </div>
  );
}
