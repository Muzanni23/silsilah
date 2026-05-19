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
  latitude: number;
  longitude: number;
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

  // Manual fields
  const [jalan, setJalan] = useState(initialAddress?.jalan || "");
  const [kelurahan, setKelurahan] = useState(initialAddress?.kelurahan || "");
  const [kecamatan, setKecamatan] = useState(initialAddress?.kecamatan || "");
  const [kabupaten, setKabupaten] = useState(initialAddress?.kabupaten || "");
  const [provinsi, setProvinsi] = useState(initialAddress?.provinsi || "");

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search via Nominatim
  const searchAddress = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          new URLSearchParams({
            q: q,
            format: "json",
            addressdetails: "1",
            limit: "6",
            countrycodes: "id", // Prioritas Indonesia
            "accept-language": "id",
          }),
        {
          headers: { "User-Agent": "BaniAbdMutthalib-FamilyTree/1.0" },
        }
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

  // Sync manual inputs to parent state immediately when any input field changes
  useEffect(() => {
    onSelect({
      jalan,
      kelurahan,
      kecamatan,
      kabupaten,
      provinsi,
      latitude: selected?.latitude || 0,
      longitude: selected?.longitude || 0,
      displayName: selected?.displayName || [jalan, kelurahan, kecamatan, kabupaten, provinsi].filter(Boolean).join(", "),
    });
  }, [jalan, kelurahan, kecamatan, kabupaten, provinsi, selected, onSelect]);

  const initJalan = initialAddress?.jalan;
  const initKelurahan = initialAddress?.kelurahan;
  const initKecamatan = initialAddress?.kecamatan;
  const initKabupaten = initialAddress?.kabupaten;
  const initProvinsi = initialAddress?.provinsi;
  const initLat = initialAddress?.latitude;
  const initLng = initialAddress?.longitude;

  // Sync state ketika initialAddress berubah dari parent (misal dari Map Picker)
  useEffect(() => {
    if (initJalan !== undefined && initJalan !== jalan) setJalan(initJalan);
    if (initKelurahan !== undefined && initKelurahan !== kelurahan) setKelurahan(initKelurahan);
    if (initKecamatan !== undefined && initKecamatan !== kecamatan) setKecamatan(initKecamatan);
    if (initKabupaten !== undefined && initKabupaten !== kabupaten) setKabupaten(initKabupaten);
    if (initProvinsi !== undefined && initProvinsi !== provinsi) setProvinsi(initProvinsi);
    if (
      initLat !== undefined &&
      initLng !== undefined &&
      (initLat !== selected?.latitude || initLng !== selected?.longitude)
    ) {
      setSelected({
        jalan: initJalan || "",
        kelurahan: initKelurahan || "",
        kecamatan: initKecamatan || "",
        kabupaten: initKabupaten || "",
        provinsi: initProvinsi || "",
        latitude: initLat,
        longitude: initLng,
        displayName: initialAddress?.displayName || "",
      });
    }
  }, [initJalan, initKelurahan, initKecamatan, initKabupaten, initProvinsi, initLat, initLng]);

  // Emit perubahan manual
  const emitManualChange = useCallback(() => {
    onSelect({
      jalan,
      kelurahan,
      kecamatan,
      kabupaten,
      provinsi,
      latitude: selected?.latitude || 0,
      longitude: selected?.longitude || 0,
      displayName: selected?.displayName || [jalan, kelurahan, kecamatan, kabupaten, provinsi].filter(Boolean).join(", "),
    });
  }, [jalan, kelurahan, kecamatan, kabupaten, provinsi, selected, onSelect]);

  // Update koordinat dari luar (coordinate picker)
  const updateFromCoordinates = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?` +
            new URLSearchParams({
              lat: lat.toString(),
              lon: lng.toString(),
              format: "json",
              addressdetails: "1",
              "accept-language": "id",
            }),
          { headers: { "User-Agent": "BaniAbdMutthalib-FamilyTree/1.0" } }
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
            onChange={(e) => { setJalan(e.target.value); }}
            onBlur={emitManualChange}
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
              onChange={(e) => setKelurahan(e.target.value)}
              onBlur={emitManualChange}
              placeholder="Kelurahan"
              className="w-full px-3.5 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Kecamatan</label>
            <input
              type="text"
              value={kecamatan}
              onChange={(e) => setKecamatan(e.target.value)}
              onBlur={emitManualChange}
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
              onChange={(e) => setKabupaten(e.target.value)}
              onBlur={emitManualChange}
              placeholder="Kabupaten / Kota"
              className="w-full px-3.5 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Provinsi</label>
            <input
              type="text"
              value={provinsi}
              onChange={(e) => setProvinsi(e.target.value)}
              onBlur={emitManualChange}
              placeholder="Provinsi"
              className="w-full px-3.5 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
