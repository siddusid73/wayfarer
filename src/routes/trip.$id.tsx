import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { ArrowUp, ArrowDown, X, Copy, Download, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PlaceSearch } from "@/components/PlaceSearch";
import { Button } from "@/components/ui/button";
import { formatDuration, getPois, getRoute, POI_CATEGORIES, type Place, type Poi, type PoiCategoryId, type RouteResult } from "@/lib/geo";
import { getTrip, moveItem, saveTrip, tripToText, type Trip } from "@/lib/trips";

const TripMap = lazy(() => import("@/components/TripMap"));

export const Route = createFileRoute("/trip/$id")({
  head: () => ({
    meta: [
      { title: "Trip route — Wayfarer" },
      { name: "description", content: "Your road trip route, stops and nearby places." },
      { property: "og:title", content: "Trip route — Wayfarer" },
      { property: "og:description", content: "Road trip route with stops and nearby places." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TripPage,
});

function TripPage() {
  const { id } = Route.useParams();
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeState, setRouteState] = useState<"idle" | "loading" | "error">("idle");
  const [routeErr, setRouteErr] = useState("");
  const [cat, setCat] = useState<PoiCategoryId | null>(null);
  const [nearIdx, setNearIdx] = useState(0);
  const [pois, setPois] = useState<Poi[]>([]);
  const [poiState, setPoiState] = useState<"idle" | "loading" | "error">("idle");
  const [poiRetry, setPoiRetry] = useState(0);
  const [activePoi, setActivePoi] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTrip(getTrip(id) ?? null); setMounted(true); }, [id]);

  const update = (t: Trip) => { setTrip(t); saveTrip(t); };

  const refresh = useCallback(async (stops: Place[]) => {
    if (stops.length < 2) { setRoute(null); return; }
    setRouteState("loading");
    try { setRoute(await getRoute(stops)); setRouteState("idle"); }
    catch (e) { setRoute(null); setRouteErr(e instanceof Error ? e.message : "Routing failed"); setRouteState("error"); }
  }, []);

  const stopsKey = trip?.stops.map((s) => s.id).join(",");
  useEffect(() => { if (trip) refresh(trip.stops); }, [stopsKey]);

  useEffect(() => {
    setPois([]); setActivePoi(null); setPoiState("idle");
    const near = trip?.stops[Math.min(nearIdx, trip.stops.length - 1)];
    if (!near || !cat) return;
    const ctrl = new AbortController();
    setPoiState("loading");
    const timer = setTimeout(() => {
      getPois(cat, near, 5000, ctrl.signal).then((r) => {
        if (!ctrl.signal.aborted) { setPois(r); setPoiState("idle"); }
      }).catch(() => { if (!ctrl.signal.aborted) setPoiState("error"); });
    }, 450);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [cat, nearIdx, stopsKey, poiRetry]);

  if (trip === undefined) return <div className="p-10 text-center text-muted-foreground">Loading trip…</div>;
  if (trip === null) return (
    <div className="p-10 text-center">
      <p>Trip not found on this device.</p>
      <Link to="/" className="mt-4 inline-block text-primary underline">Plan a new trip</Link>
    </div>
  );

  const setStops = (stops: Place[]) => update({ ...trip, stops });
  const text = tripToText(trip) + (route ? `\n\nTotal: ${route.distanceKm.toFixed(0)} km, about ${formatDuration(route.durationMin)} driving (estimate)` : "");

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[380px_1fr]">
      <aside className="space-y-5">
        <div>
          <label htmlFor="title" className="sr-only">Trip name</label>
          <input id="title" value={trip.title} onChange={(e) => update({ ...trip, title: e.target.value })}
            className="w-full rounded-md bg-transparent font-display text-xl font-bold outline-none focus:ring-2 focus:ring-ring" />
          <div className="mt-2 flex gap-2 text-sm">
            <input type="date" aria-label="Start date" value={trip.startDate ?? ""} onChange={(e) => update({ ...trip, startDate: e.target.value })} className="h-9 rounded-md border border-input bg-card px-2" />
            <input type="text" inputMode="numeric" aria-label="Days" placeholder="0" value={trip.days === undefined ? "" : String(trip.days)}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); const { days: _d, ...rest } = trip; update(v === "" ? rest : { ...rest, days: Number(v) }); }}
              className="h-9 w-20 rounded-md border border-input bg-card px-2" />
            <span className="self-center text-muted-foreground">days</span>
          </div>
        </div>

        <section aria-label="Stops" className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Stops</h2>
          <ol className="mt-3 space-y-2">
            {trip.stops.map((s, i) => (
              <li key={s.id + i} className="animate-rise flex items-center gap-2 rounded-lg bg-muted p-2">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${i === trip.stops.length - 1 ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}>
                  {i === 0 ? "S" : i === trip.stops.length - 1 ? "F" : i}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{s.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{s.detail}</div>
                  {route && i > 0 && route.legs[i - 1] && <div className="text-[11px] text-muted-foreground">+{route.legs[i - 1]!.distanceKm.toFixed(0)} km · {formatDuration(route.legs[i - 1]!.durationMin)}</div>}
                </div>
                <button aria-label={`Move ${s.name} up`} disabled={i === 0} onClick={() => setStops(moveItem(trip.stops, i, i - 1))} className="rounded p-1 hover:bg-secondary disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                <button aria-label={`Move ${s.name} down`} disabled={i === trip.stops.length - 1} onClick={() => setStops(moveItem(trip.stops, i, i + 1))} className="rounded p-1 hover:bg-secondary disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                <button aria-label={`Remove ${s.name}`} onClick={() => setStops(trip.stops.filter((_, j) => j !== i))} className="rounded p-1 hover:bg-secondary hover:text-destructive"><X className="h-4 w-4" /></button>
              </li>
            ))}
          </ol>
          <div className="mt-3">
            <PlaceSearch clearOnSelect label="Add a stop" placeholder="Search an Indian town or landmark" onSelect={(p) => {
              const s = [...trip.stops];
              s.splice(Math.max(s.length - 1, 0), 0, p); // insert before destination
              setStops(s.length === 1 ? [p] : s);
            }} />
            <p className="mt-1 text-[11px] text-muted-foreground">New stops are added before the destination. Use the arrows to reorder.</p>
          </div>
        </section>

        <section aria-live="polite" className="rounded-xl border border-border bg-card p-4">
          {routeState === "loading" && <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Calculating route…</p>}
          {routeState === "error" && <p role="alert" className="flex gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4 shrink-0" />{routeErr} Your stop list is still saved.</p>}
          {trip.stops.length < 2 && <p className="text-sm text-muted-foreground">Add at least two stops to see a route.</p>}
          {route && routeState === "idle" && (
            <div>
              <div className="flex gap-6">
                <div><div className="font-display text-2xl font-bold">{route.distanceKm.toFixed(0)} km</div><div className="text-xs text-muted-foreground">distance</div></div>
                <div><div className="font-display text-2xl font-bold">{formatDuration(route.durationMin)}</div><div className="text-xs text-muted-foreground">est. driving</div></div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Estimate from OSRM road data. No live traffic.</p>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => refresh(trip.stops)} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary">Refresh route</button>
            <button onClick={async () => { try { await navigator.clipboard.writeText(text); toast.success("Itinerary copied"); } catch { toast.error("Copy blocked — use Download instead"); } }}
              className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"><Copy className="h-4 w-4" /> Copy</button>
            <button onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = `${trip.title}.txt`; a.click(); }}
              className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"><Download className="h-4 w-4" /> Download</button>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Nearby places</h2>
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Categories">
            {POI_CATEGORIES.map((c) => (
              <Button variant="outline" size="sm" key={c.id} aria-pressed={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}
                className={`h-auto rounded-full px-3 py-1 text-xs ${cat === c.id ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "border-border hover:bg-secondary"}`}>{c.label}</Button>
            ))}
          </div>
          <label className="mt-3 block text-xs text-muted-foreground">Search within 5 km of
            <select value={nearIdx} onChange={(e) => setNearIdx(+e.target.value)} className="ml-2 rounded-md border border-input bg-card px-2 py-1 text-foreground">
              {trip.stops.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
            </select>
          </label>
          <div aria-live="polite" className="mt-3 max-h-72 space-y-2 overflow-auto">
            {!cat && <p className="text-sm text-muted-foreground">Pick a category to find places near a stop.</p>}
            {cat && poiState === "loading" && <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Searching OpenStreetMap…</p>}
            {cat && poiState === "error" && <div><p role="alert" className="text-sm text-destructive">Nearby places are temporarily unavailable. Your route is still saved.</p><Button variant="outline" size="sm" className="mt-2" onClick={() => setPoiRetry((n) => n + 1)}>Try again</Button></div>}
            {cat && poiState === "idle" && pois.length === 0 && <p className="text-sm text-muted-foreground">No mapped places found here. OpenStreetMap coverage varies by region.</p>}
            {cat && poiState === "idle" && pois.length > 0 && <p className="text-[11px] text-muted-foreground">OpenStreetMap results; some places may be missing.</p>}
            {pois.map((p) => (
              <div key={p.id} className={`w-full rounded-lg border p-2 text-left text-sm ${activePoi === p.id ? "border-primary bg-secondary" : "border-border"}`}>
                <Button variant="ghost" onClick={() => setActivePoi(p.id)} className="h-auto w-full justify-start whitespace-normal p-0 text-left font-semibold hover:bg-transparent">{p.name}</Button>
                <div className="text-xs text-muted-foreground">{POI_CATEGORIES.find((c) => c.id === p.category)?.label} · near {p.nearStop} · OSM</div>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <div className="h-[60vh] lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)]">
        {mounted && (
          <Suspense fallback={<div className="grid h-full place-items-center rounded-xl bg-muted text-sm">Loading map…</div>}>
            <TripMap stops={trip.stops} route={route?.coords ?? null} pois={pois} activePoi={activePoi} onPoiClick={setActivePoi} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
