"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Reverse geocode dari Nominatim
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
        new URLSearchParams({
          lat: lat.toString(),
          lon: lng.toString(),
          format: "json",
          "accept-language": "id",
        }),
      { headers: { "User-Agent": "BaniAbdMutthalib-FamilyTree/1.0" } }
    );
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}

function ClickHandler({
  onSelect,
  setPos,
  setAddr,
}: {
  onSelect: (lat: number, lng: number) => void;
  setPos: (p: [number, number]) => void;
  setAddr: (a: string) => void;
}) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      setPos([lat, lng]);
      setAddr("Memuat alamat...");
      onSelect(lat, lng);
      const name = await reverseGeocode(lat, lng);
      if (name) setAddr(name);
      else setAddr(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    },
  });
  return null;
}

// Fly to new position when changed externally
function FlyToPosition({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) {
      map.flyTo(pos, 16, { duration: 1.2 });
    }
  }, [pos, map]);
  return null;
}

export default function CoordinatePicker({
  onSelect,
  initialLat,
  initialLng,
  externalPos,
}: {
  onSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  externalPos?: [number, number] | null; // dari address autocomplete
}) {
  const center: [number, number] = [initialLat || -2.5, initialLng || 118];
  const [pos, setPos] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [addr, setAddr] = useState<string>("");

  // Sync dari luar (address autocomplete)
  useEffect(() => {
    if (externalPos) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPos(externalPos);
      reverseGeocode(externalPos[0], externalPos[1]).then((name) => {
        if (name) setAddr(name);
      });
    }
  }, [externalPos]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={initialLat ? 13 : 5}
        style={{ height: "100%", width: "100%" }}
        className="rounded-b-2xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onSelect={onSelect} setPos={setPos} setAddr={setAddr} />
        {pos && <Marker position={pos} icon={icon} />}
        <FlyToPosition pos={externalPos ?? null} />
      </MapContainer>

      {/* Coordinate + Address display */}
      <div className="absolute bottom-3 left-3 right-3 glass rounded-lg px-3 py-2.5 z-[1000]">
        {pos ? (
          <div>
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
              📍 {pos[0].toFixed(6)}, {pos[1].toFixed(6)}
            </p>
            {addr && addr !== "Memuat alamat..." && (
              <p className="text-[10px] text-muted mt-0.5 truncate">{addr}</p>
            )}
            {addr === "Memuat alamat..." && (
              <p className="text-[10px] text-muted mt-0.5 animate-pulse">Memuat alamat...</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted">Klik peta untuk memilih titik koordinat</p>
        )}
      </div>

      {/* Instruction overlay */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-1.5 z-[1000] text-[10px] text-muted pointer-events-none">
        Klik untuk pin · Geser untuk navigasi · Scroll untuk zoom
      </div>
    </div>
  );
}
