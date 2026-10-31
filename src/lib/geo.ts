// Free/open providers: Nominatim (geocoding), OSRM demo (routing), Overpass (POIs).
// All are rate-limited public services — calls are debounced and cached in memory.

export type Place = { id: string; name: string; detail: string; lat: number; lon: number };

const cache = new Map<string, unknown>();

async function cachedJson<T>(url: string, init?: RequestInit): Promise<T> {
  const key = url + (init?.body ?? "");
  if (cache.has(key)) return cache.get(key) as T;
  const res = await fetch(url, init);
  if (res.status === 429) throw new Error("The free map service is busy (rate limit). Please wait a moment and try again.");
  if (!res.ok) throw new Error(res.status === 400 ? "NO_ROUTE" : `The service is unavailable right now (error ${res.status}).`);
  const data = (await res.json()) as T;
  cache.set(key, data);
  return data;
}

type NominatimHit = { place_id: number; display_name: string; name?: string; lat: string; lon: string; address?: { state?: string; country?: string } };

export type SearchScope = "india" | "all";

// India is the primary scope: searches are restricted to India (countrycodes=in)
// unless the user opts into international results.
type PhotonFeature = { geometry: { coordinates: [number, number] }; properties: { osm_id: number; osm_type: string; name?: string; city?: string; district?: string; county?: string; state?: string; country?: string; countrycode?: string } };

// Photon (komoot, keyless) supports type-ahead prefix matching; Nominatim is the fallback.
export async function searchPlaces(q: string, signal?: AbortSignal, scope: SearchScope = "india"): Promise<Place[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  try {
    const bbox = scope === "india" ? "&bbox=68.1,6.5,97.5,35.7" : "";
    const data = await cachedJson<{ features: PhotonFeature[] }>(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10&lang=en${bbox}`, { signal: signal ?? null });
    const seen = new Set<string>();
    const out = data.features.flatMap((f): Place[] => {
      const p = f.properties;
      if (!p.name || (scope === "india" && p.countrycode && p.countrycode !== "IN")) return [];
      const detail = [p.city !== p.name ? p.city : "", p.district, p.state, p.country].filter(Boolean).join(", ");
      const key = p.name + detail;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ id: `${p.osm_type}${p.osm_id}`, name: p.name, detail: detail || p.name, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }];
    }).slice(0, 7);
    if (out.length) return out;
  } catch (e) { if (signal?.aborted) throw e; }
  const cc = scope === "india" ? "&countrycodes=in" : "";
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1${cc}&q=${encodeURIComponent(query)}`;
  const hits = await cachedJson<NominatimHit[]>(url, { signal: signal ?? null, headers: { "Accept-Language": "en" } });
  return hits.map(toPlace);
}

const q0 = (h: NominatimHit) => h.display_name;
export function toPlace(h: NominatimHit): Place {
  const parts = h.display_name.split(",").map((s) => s.trim());
  const name = h.name || parts[0] || q0(h);
  // Surface the state/UT (or country) so users can tell same-named places apart.
  const region = h.address?.state || h.address?.country || "";
  const rest = parts.slice(1).filter((p) => p !== region);
  const detail = [region, ...rest].filter(Boolean).join(", ") || name;
  return { id: String(h.place_id), name, detail, lat: +h.lat, lon: +h.lon };
}

export type RouteResult = { distanceKm: number; durationMin: number; coords: [number, number][]; legs: { distanceKm: number; durationMin: number }[] };

export async function getRoute(points: { lat: number; lon: number }[]): Promise<RouteResult> {
  if (points.length < 2) throw new Error("Add at least a start and a destination.");
  const path = points.map((p) => `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`;
  let data: { code: string; routes: { distance: number; duration: number; geometry: { coordinates: [number, number][] }; legs: { distance: number; duration: number }[] }[] };
  try { data = await cachedJson(url); } catch (e) {
    if (e instanceof Error && e.message === "NO_ROUTE") throw new Error("No drivable route found. A stop may be across the sea or off the road network — check the stop list.");
    throw e;
  }
  if (data.code !== "Ok" || !data.routes[0]) throw new Error("No drivable route found between these places.");
  const r = data.routes[0];
  return {
    distanceKm: r.distance / 1000,
    durationMin: r.duration / 60,
    coords: r.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    legs: r.legs.map((l) => ({ distanceKm: l.distance / 1000, durationMin: l.duration / 60 })),
  };
}

export const POI_CATEGORIES = [
  { id: "stay", label: "Stays", filter: '["tourism"~"hotel|motel|guest_house|hostel|camp_site"]' },
  { id: "food", label: "Food & cafés", filter: '["amenity"~"restaurant|cafe"]' },
  { id: "view", label: "Viewpoints", filter: '["tourism"="viewpoint"]' },
  { id: "sight", label: "Attractions", filter: '["tourism"~"attraction|museum"]' },
  { id: "fuel", label: "Fuel", filter: '["amenity"="fuel"]' },
  { id: "ev", label: "EV charging", filter: '["amenity"="charging_station"]' },
  { id: "rest", label: "Rest areas", filter: '["highway"="rest_area"]' },
] as const;
export type PoiCategoryId = (typeof POI_CATEGORIES)[number]["id"];

export type Poi = { id: string; name: string; category: PoiCategoryId; lat: number; lon: number; nearStop: string };

const POI_BACKUP_TERMS: Record<PoiCategoryId, string> = {
  stay: "hotel", food: "restaurant", view: "viewpoint", sight: "attraction",
  fuel: "fuel", ev: "charging_station", rest: "rest_area",
};

function distanceMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = Math.PI / 180;
  const h = Math.sin((b.lat - a.lat) * rad / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lon - a.lon) * rad / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export async function getPois(cat: PoiCategoryId, near: { name: string; lat: number; lon: number }, radiusM = 5000, signal?: AbortSignal): Promise<Poi[]> {
  const c = POI_CATEGORIES.find((x) => x.id === cat);
  if (!c) return [];
  const requestSignal = (ms: number) => signal ? AbortSignal.any([signal, AbortSignal.timeout(ms)]) : AbortSignal.timeout(ms);
  const q = `[out:json][timeout:5];nwr${c.filter}["name"](around:${radiusM},${near.lat},${near.lon});out center 25;`;
  type Resp = { elements: { id: number; type: string; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] };
  try {
    const data = await cachedJson<Resp>(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`, { signal: requestSignal(7000) });
    if (!Array.isArray(data.elements) || "remark" in data) throw new Error("Incomplete nearby search");
    return data.elements.flatMap((e): Poi[] => {
      const name = e.tags?.["name"];
      const lat = e.lat ?? e.center?.lat;
      const lon = e.lon ?? e.center?.lon;
      if (!name || lat === undefined || lon === undefined) return [];
      return [{ id: `${e.type}/${e.id}`, name, category: cat, lat, lon, nearStop: near.name }];
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    // A different provider, not another overloaded Overpass mirror. Bounded
    // Nominatim search is less comprehensive; retain the exact radial limit.
    const dLat = radiusM / 111195;
    const dLon = dLat / Math.max(0.01, Math.cos(near.lat * Math.PI / 180));
    const params = new URLSearchParams({ format: "jsonv2", limit: "25", bounded: "1", q: POI_BACKUP_TERMS[cat], viewbox: `${near.lon - dLon},${near.lat + dLat},${near.lon + dLon},${near.lat - dLat}` });
    type Hit = NominatimHit & { osm_type: string; osm_id: number; type: string };
    const hits = await cachedJson<Hit[]>(`https://nominatim.openstreetmap.org/search?${params}`, { signal: requestSignal(12000), headers: { "Accept-Language": "en" } });
    return hits.flatMap((h): Poi[] => {
      const p = toPlace(h);
      if (h.type !== POI_BACKUP_TERMS[cat] || !Number.isFinite(p.lat) || !Number.isFinite(p.lon) || distanceMeters(near, p) > radiusM) return [];
      return [{ ...p, id: `${h.osm_type}/${h.osm_id}`, category: cat, nearStop: near.name }];
    }).sort((a, b) => distanceMeters(near, a) - distanceMeters(near, b));
  }
}

export function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}
