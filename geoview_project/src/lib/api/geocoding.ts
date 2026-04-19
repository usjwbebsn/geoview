/**
 * Geocoding via OpenStreetMap Nominatim.
 * Free, no API key required.
 * Rate limit: 1 request/second — debounce search input!
 * Docs: https://nominatim.org/release-docs/develop/api/Search/
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_NOMINATIM_URL ?? "https://nominatim.openstreetmap.org";

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  boundingbox: [string, string, string, string]; // [minLat, maxLat, minLon, maxLon]
  importance: number;
  icon?: string;
}

export interface GeocodedPlace {
  id: number;
  displayName: string;
  shortName: string;
  lat: number;
  lon: number;
  bbox: { west: number; south: number; east: number; north: number };
  type: string;
}

function parseResult(r: NominatimResult): GeocodedPlace {
  const [minLat, maxLat, minLon, maxLon] = r.boundingbox;
  // Short name is the first comma-separated part
  const shortName = r.display_name.split(",")[0].trim();
  return {
    id: r.place_id,
    displayName: r.display_name,
    shortName,
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    bbox: {
      west: parseFloat(minLon),
      east: parseFloat(maxLon),
      south: parseFloat(minLat),
      north: parseFloat(maxLat),
    },
    type: r.type,
  };
}

export async function geocodeSearch(
  query: string,
  limit = 6
): Promise<GeocodedPlace[]> {
  if (!query.trim()) return [];

  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("addressdetails", "0");

  const res = await fetch(url.toString(), {
    headers: {
      "Accept-Language": "en",
      // Nominatim ToS requires a User-Agent
      "User-Agent": "GeoView/1.0 (https://github.com/your-org/geoview)",
    },
  });

  if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);

  const data: NominatimResult[] = await res.json();
  return data.map(parseResult);
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<GeocodedPlace | null> {
  const url = new URL(`${BASE_URL}/reverse`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "GeoView/1.0" },
  });

  if (!res.ok) return null;

  const data: NominatimResult = await res.json();
  return parseResult(data);
}
