import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  try {
    if (q) {
      // Perform Nominatim Search
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          new URLSearchParams({
            q: q,
            format: "json",
            addressdetails: "1",
            limit: "6",
            countrycodes: "id",
            "accept-language": "id",
          }),
        {
          headers: { "User-Agent": "BaniAbdMutthalib-FamilyTree/1.0" },
        }
      );
      const data = await res.json();
      return Response.json(data);
    } else if (lat && lon) {
      // Perform Nominatim Reverse Geocoding
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
          new URLSearchParams({
            lat: lat,
            lon: lon,
            format: "json",
            addressdetails: "1",
            "accept-language": "id",
          }),
        {
          headers: { "User-Agent": "BaniAbdMutthalib-FamilyTree/1.0" },
        }
      );
      const data = await res.json();
      return Response.json(data);
    }

    return Response.json({ error: "Missing parameters q or (lat and lon)" }, { status: 400 });
  } catch (error) {
    console.error("Autocomplete proxy error:", error);
    return Response.json({ error: "Failed to fetch from Nominatim" }, { status: 500 });
  }
}
