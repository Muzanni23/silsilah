"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, Loader2, X, Navigation } from "lucide-react";

// Tipe data alamat terstruktur ala ekspedisi/ojol
export interface AddressData {
  jalan: string;
  kelurahan: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  latitude?: number;
  longitude?: number;
  displayName: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    village?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    county?: string;
    city?: string;
    town?: string;
    municipality?: string;
    state?: string;
    country?: string;
    postcode?: string;
    [key: string]: string | undefined;
  };
}

// Parse Nominatim address ke format Indonesia
function parseAddress(result: NominatimResult): AddressData {
  const a = result.address;
  return {
    jalan: a.road || "",
    kelurahan: a.village || a.suburb || a.neighbourhood || "",
    kecamatan: a.city_district || a.county || "",
    kabupaten: a.city || a.town || a.municipality || "",
    provinsi: a.state || "",
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    displayName: result.display_name,
  };
}

export default function AddressAutocomplete({
  onSelect,
  initialAddress,
  label = "Cari Alamat Domisili",
}: {
  onSelect: (address: AddressData) => void;
  initialAddress?: Partial<AddressData>;
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<AddressData | null>(
    initialAddress?.latitude ? (initialAddress as AddressData) : null
  );

  // Manual fields — initialized once from initialAddress, then self-managed
  const [jalan, setJalan] = useState(initialAddress?.jalan || "");
  const [kelurahan, setKelurahan] = useState(initialAddress?.kelurahan || "");
  const [kecamatan, setKecamatan] = useState(initialAddress?.kecamatan || "");
  const [kabupaten, setKabupaten] = useState(initialAddress?.kabupaten || "");
  const [provinsi, setProvinsi] = useState(initialAddress?.provinsi || "");

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  // Track whether an external source (Map Picker) has pushed new coordinates
  const prevExternalCoordsRef = useRef<string>(
    `${initialAddress?.latitude ?? ""},${initialAddress?.longitude ?? ""}`
  );

  // Debounced search via Nominatim
  const searchAddress = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/autocomplete?` +
          new URLSearchParams({
            q: q,
          })
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setShowDropdown(data.length > 0);
    } catch (e) {
      console.error("Nominatim search error:", e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(value), 500);
  };

  // Helper: build current address from local state
  const buildCurrentAddress = useCallback(
    (overrides?: Partial<AddressData>): AddressData => {
      const j = overrides?.jalan ?? jalan;
      const kel = overrides?.kelurahan ?? kelurahan;
      const kec = overrides?.kecamatan ?? kecamatan;
      const kab = overrides?.kabupaten ?? kabupaten;
      const prov = overrides?.provinsi ?? provinsi;
      return {
        jalan: j,
        kelurahan: kel,
        kecamatan: kec,
        kabupaten: kab,
        provinsi: prov,
        latitude: overrides?.latitude ?? selected?.latitude,
        longitude: overrides?.longitude ?? selected?.longitude,
        displayName:
          overrides?.displayName ??
          selected?.displayName ??
          [j, kel, kec, kab, prov].filter(Boolean).join(", "),
      };
    },
    [jalan, kelurahan, kecamatan, kabupaten, provinsi, selected]
  );

  const handleSelect = (result: NominatimResult) => {
    const addr = parseAddress(result);
    setSelected(addr);
    setJalan(addr.jalan);
    setKelurahan(addr.kelurahan);
    setKecamatan(addr.kecamatan);
    setKabupaten(addr.kabupaten);
    setProvinsi(addr.provinsi);
    setQuery("");
    setShowDropdown(false);
    onSelect(addr);
  };

  const handleClear = () => {
    setSelected(null);
    setJalan("");
    setKelurahan("");
    setKecamatan("");
    setKabupaten("");
    setProvinsi("");
    setQuery("");
    setResults([]);
  };

  // Sync ONLY when parent sends genuinely new coordinates (from Map Picker click).
  // We detect this by comparing the incoming lat/lng against what we last saw.
  const initLat = initialAddress?.latitude;
  const initLng = initialAddress?.longitude;

  useEffect(() => {
    const newKey = `${initLat ?? ""},${initLng ?? ""}`;
    if (newKey === prevExternalCoordsRef.current) {
      return; // No coordinate change from outside — skip
    }
    prevExternalCoordsRef.current = newKey;

    // Coordinates changed from outside (Map Picker) — sync all fields
    if (initLat !== undefined && initLng !== undefined) {
      const initJ = initialAddress?.jalan || "";
      const initKel = initialAddress?.kelurahan || "";
      const initKec = initialAddress?.kecamatan || "";
      const initKab = initialAddress?.kabupaten || "";
      const initProv = initialAddress?.provinsi || "";

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJalan(initJ);
      setKelurahan(initKel);
      setKecamatan(initKec);
      setKabupaten(initKab);
      setProvinsi(initProv);
      setSelected({
        jalan: initJ,
        kelurahan: initKel,
        kecamatan: initKec,
        kabupaten: initKab,
        provinsi: initProv,
        latitude: initLat,
        longitude: initLng,
        displayName: initialAddress?.displayName || "",
      });
    }
  }, [initLat, initLng, initialAddress]);

  // Emit to parent on each keystroke (no effect loop — direct call from onChange)
  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      const overrides: Partial<AddressData> = { [field]: value };
      // We need to read latest values, but since this is called inline with setState,
      // we pass the override for the changed field
      const addr = buildCurrentAddress(overrides);
      onSelect(addr);
    },
    [buildCurrentAddress, onSelect]
  );

  // Update koordinat dari luar (coordinate picker)
  const updateFromCoordinates = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `/api/autocomplete?` +
            new URLSearchParams({
              lat: lat.toString(),
              lon: lng.toString(),
            })
        );
        const data: NominatimResult = await res.json();
        const addr = parseAddress(data);
        addr.latitude = lat;
        addr.longitude = lng;
        setSelected(addr);
        setJalan(addr.jalan);
        setKelurahan(addr.kelurahan);
        setKecamatan(addr.kecamatan);
        setKabupaten(addr.kabupaten);
        setProvinsi(addr.provinsi);
        onSelect(addr);
      } catch (e) {
        console.error("Reverse geocode error:", e);
        // Tetap set koordinat meski reverse geocode gagal
        const addr: AddressData = {
          jalan, kelurahan, kecamatan, kabupaten, provinsi,
          latitude: lat, longitude: lng, displayName: `${lat}, ${lng}`,
        };
        setSelected(addr);
        onSelect(addr);
      }
    },
    [jalan, kelurahan, kecamatan, kabupaten, provinsi, onSelect]
  );

  // Expose updateFromCoordinates via ref
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as unknown as { updateFromCoordinates: typeof updateFromCoordinates }).updateFromCoordinates = updateFromCoordinates;
    }
  }, [updateFromCoordinates]);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="space-y-3" data-address-autocomplete>
      {/* Search Bar ala Ojol */}
      <div>
        <label className="block text-xs font-medium text-muted mb-1.5">{label}</label>
        <div className="relative">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border focus-within:border-gold/50 transition-colors">
            {loading ? (
              <Loader2 size={16} className="text-muted animate-spin shrink-0" />
            ) : (
              <Search size={16} className="text-muted shrink-0" />
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              placeholder="Ketik alamat, nama jalan, atau kelurahan..."
              className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1"
            />
            {(query || selected) && (
              <button onClick={handleClear} className="text-muted hover:text-foreground shrink-0">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Dropdown Results */}
          {showDropdown && (
            <div className="absolute z-30 top-full mt-1 w-full glass rounded-xl border border-border shadow-2xl max-h-64 overflow-y-auto animate-fade-in">
              {results.map((r) => {
                const addr = parseAddress(r);
                return (
                  <button
                    key={r.place_id}
                    type="button"
                    onClick={() => handleSelect(r)}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 text-left transition-colors border-b border-border/50 last:border-b-0"
                  >
                    <MapPin size={16} className="text-gold-light shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {addr.jalan || addr.kelurahan || addr.kecamatan || r.display_name.split(",")[0]}
                      </p>
                      <p className="text-[11px] text-muted truncate">
                        {[addr.kelurahan, addr.kecamatan, addr.kabupaten, addr.provinsi]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected Address Badge */}
      {selected && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-gold-muted/20 border border-gold/20 animate-fade-in">
          <Navigation size={14} className="text-gold-light shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{selected.displayName}</p>
            <p className="text-[10px] text-muted">
              📍 {selected.latitude?.toFixed(6) ?? "?"}, {selected.longitude?.toFixed(6) ?? "?"}
            </p>
          </div>
          <button onClick={handleClear} className="text-muted hover:text-foreground shrink-0">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Structured Fields ala Ekspedisi */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-muted mb-1">Jalan / Alamat Detail</label>
          <input
            type="text"
            value={jalan}
            onChange={(e) => {
              setJalan(e.target.value);
              handleFieldChange("jalan", e.target.value);
            }}
            placeholder="Jl. Merdeka No. 10, RT 01/RW 05"
            className="w-full px-3.5 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Kelurahan / Desa</label>
            <input
              type="text"
              value={kelurahan}
              onChange={(e) => {
                setKelurahan(e.target.value);
                handleFieldChange("kelurahan", e.target.value);
              }}
              placeholder="Kelurahan"
              className="w-full px-3.5 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Kecamatan</label>
            <input
              type="text"
              value={kecamatan}
              onChange={(e) => {
                setKecamatan(e.target.value);
                handleFieldChange("kecamatan", e.target.value);
              }}
              placeholder="Kecamatan"
              className="w-full px-3.5 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Kabupaten / Kota</label>
            <input
              type="text"
              value={kabupaten}
              onChange={(e) => {
                setKabupaten(e.target.value);
                handleFieldChange("kabupaten", e.target.value);
              }}
              placeholder="Kabupaten / Kota"
              className="w-full px-3.5 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Provinsi</label>
            <input
              type="text"
              value={provinsi}
              onChange={(e) => {
                setProvinsi(e.target.value);
                handleFieldChange("provinsi", e.target.value);
              }}
              placeholder="Provinsi"
              className="w-full px-3.5 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
