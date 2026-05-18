"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Gender, Person } from "@/lib/types";
import { useMemo, useEffect } from "react";

// Fix default marker icons
const createIcon = (color: string) =>
  new L.DivIcon({
    className: "custom-marker",
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,0.3);box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
      <div style="width:8px;height:8px;border-radius:50%;background:white;"></div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const maleIcon = createIcon("#60a5fa");
const femaleIcon = createIcon("#f472b6");
const graveIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#6b7280;border:3px solid rgba(255,255,255,0.2);box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:12px;">🕊</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const userIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#ef4444;border:3px solid rgba(255,255,255,0.8);box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:14px;animation: pulse 2s infinite;">📍</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

interface Props {
  mode: "domisili" | "makam";
  initialCenter?: [number, number] | null;
  userLocation?: [number, number] | null;
  persons: Person[];
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
}

function MapController({ center }: { center?: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { animate: true, duration: 1.5 });
    }
  }, [map, center]);
  return null;
}

export default function FamilyMap({ mode, initialCenter, userLocation, persons }: Props) {
  const markers = useMemo(() => {
    if (mode === "domisili") {
      return persons
        .filter((p) => p.isAlive && p.latitude && p.longitude)
        .map((p) => ({
          id: p.id,
          lat: p.latitude!,
          lng: p.longitude!,
          name: p.fullName,
          icon: p.gender === Gender.MALE ? maleIcon : femaleIcon,
          detail: [p.city, p.province].filter(Boolean).join(", "),
          phone: p.phone,
          gen: p.generationNumber,
        }));
    } else {
      return persons
        .filter((p) => !p.isAlive && p.graveLatitude && p.graveLongitude)
        .map((p) => ({
          id: p.id,
          lat: p.graveLatitude!,
          lng: p.graveLongitude!,
          name: p.fullName,
          icon: graveIcon,
          detail: p.graveAddress || p.graveCity || "",
          phone: null,
          gen: p.generationNumber,
        }));
    }
  }, [mode]);

  const center: [number, number] = markers.length > 0
    ? [markers.reduce((s, m) => s + m.lat, 0) / markers.length, markers.reduce((s, m) => s + m.lng, 0) / markers.length]
    : [-6.2, 106.8];

  const nearestMakam = useMemo(() => {
    if (mode === "makam" && userLocation && markers.length > 0) {
      let nearest = markers[0];
      let minDist = calculateDistance(userLocation[0], userLocation[1], nearest.lat, nearest.lng);
      
      for (let i = 1; i < markers.length; i++) {
        const dist = calculateDistance(userLocation[0], userLocation[1], markers[i].lat, markers[i].lng);
        if (dist < minDist) {
          minDist = dist;
          nearest = markers[i];
        }
      }
      return { ...nearest, distance: minDist.toFixed(1) };
    }
    return null;
  }, [mode, userLocation, markers]);

  return (
    <>
      <MapContainer
        center={center}
        zoom={6}
        className="w-full h-full"
        style={{ background: "#0a0a0f" }}
      >
        <MapController center={initialCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={m.icon}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: "#f0ece4" }}>{m.name}</p>
                {m.gen && <p style={{ fontSize: 11, color: "#d4a853", marginBottom: 4 }}>Generasi {m.gen}</p>}
                <p style={{ fontSize: 12, color: "#8a8a9a" }}>{m.detail}</p>
                {m.phone && (
                  <a
                    href={`https://wa.me/${m.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-block", marginTop: 6, fontSize: 12, color: "#22c55e", textDecoration: "none" }}
                  >
                    💬 Hubungi via WA
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>Lokasi Anda Saat Ini</Popup>
          </Marker>
        )}
      </MapContainer>
      
      {nearestMakam && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-card/90 backdrop-blur-sm border border-gold/30 p-3 rounded-xl shadow-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-xl">🕊</div>
          <div>
            <p className="text-xs text-muted mb-0.5">Makam Terdekat</p>
            <p className="font-semibold text-sm">{nearestMakam.name}</p>
            <p className="text-xs text-gold-light mt-0.5">{nearestMakam.distance} km dari lokasi Anda</p>
          </div>
        </div>
      )}
    </>
  );
}
