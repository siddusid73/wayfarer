import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import type { Place, Poi } from "@/lib/geo";

// Vite can't locate maplibre-gl 6's worker on its own; point it at the bundled worker.
maplibregl.setWorkerUrl(maplibreWorkerUrl);

export default function TripMap({ stops, route, pois, activePoi, onPoiClick }: {
  stops: Place[]; route: [number, number][] | null; pois: Poi[]; activePoi: string | null; onPoiClick: (id: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const base = useRef<L.LayerGroup | null>(null);
  const poiLayer = useRef<L.LayerGroup | null>(null);
  const poiMarkers = useRef(new Map<string, L.Marker>());
  const clickRef = useRef(onPoiClick);
  clickRef.current = onPoiClick;

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { scrollWheelZoom: true, zoomControl: false }).setView([22.5, 79], 5);
    L.control.zoom({ position: "bottomright" }).addTo(map.current);
    // OpenFreeMap Positron: keyless, no request limits, Google-Maps-like light style
    // over OpenStreetMap data. Brings its own attribution via the style.
    maplibreGL({ style: "https://tiles.openfreemap.org/styles/positron" }).addTo(map.current);
    base.current = L.layerGroup().addTo(map.current);
    poiLayer.current = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  // Route + stops: always visible with name labels.
  useEffect(() => {
    const m = map.current, g = base.current;
    if (!m || !g) return;
    g.clearLayers();
    const bounds: L.LatLngExpression[] = [];
    if (route) {
      L.polyline(route, { color: "#ffffff", weight: 9, opacity: 0.9 }).addTo(g);
      L.polyline(route, { color: "#1a73e8", weight: 5 }).addTo(g);
      bounds.push(...route);
    }
    stops.forEach((s, i) => {
      const end = i === stops.length - 1 && stops.length > 1;
      const label = i === 0 ? "S" : end ? "F" : String(i);
      L.marker([s.lat, s.lon], { icon: L.divIcon({ html: `<div class="rt-pin ${end ? "end" : ""}"><span>${label}</span></div>`, className: "", iconSize: [30, 38], iconAnchor: [15, 38], tooltipAnchor: [0, -36] }), title: s.name })
        .bindTooltip(s.name, { permanent: true, direction: "top", className: "rt-label" })
        .bindPopup(`<strong>${s.name}</strong><br/>${s.detail}`).addTo(g);
      bounds.push([s.lat, s.lon]);
    });
    if (bounds.length) m.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 13 });
  }, [stops, route]);

  // Nearby places: all shown on the map with names.
  useEffect(() => {
    const m = map.current, g = poiLayer.current;
    if (!m || !g) return;
    g.clearLayers(); poiMarkers.current.clear();
    pois.forEach((p) => {
      const mk = L.marker([p.lat, p.lon], { icon: L.divIcon({ html: `<div class="rt-poi"></div>`, className: "", iconSize: [16, 16] }), title: p.name, keyboard: true })
        .on("click", () => clickRef.current(p.id))
        .bindPopup(`<strong>${p.name}</strong><br/>near ${p.nearStop}`)
        .bindTooltip(p.name, { direction: "top", offset: [0, -8], className: "rt-label small" })
        .addTo(g);
      poiMarkers.current.set(p.id, mk);
    });
    if (pois.length) m.fitBounds(L.latLngBounds(pois.map((p) => [p.lat, p.lon] as [number, number])), { padding: [60, 60], maxZoom: 15 });
  }, [pois]);

  useEffect(() => {
    poiMarkers.current.forEach((mk, id) => mk.getElement()?.querySelector(".rt-poi")?.classList.toggle("active", id === activePoi));
    const mk = activePoi ? poiMarkers.current.get(activePoi) : null;
    if (mk && map.current) { map.current.setView(mk.getLatLng(), Math.max(map.current.getZoom(), 15)); mk.openPopup(); }
  }, [activePoi]);

  return <div ref={el} className="h-full min-h-[360px] w-full overflow-hidden rounded-xl shadow-md" role="region" aria-label="Route map" />;
}
