import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, MapPinned, Plus } from "lucide-react";
import { deleteTrip, loadTrips, type Trip } from "@/lib/trips";

export const Route = createFileRoute("/trips")({
  head: () => ({
    meta: [
      { title: "My trips — Wayfarer" },
      { name: "description", content: "Reopen and manage your saved road trips." },
      { property: "og:title", content: "My trips — Wayfarer" },
      { property: "og:description", content: "Your saved road trips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Trips,
});

function Trips() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  useEffect(() => setTrips(loadTrips()), []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">My trips</h1>
      <p className="mt-1 text-sm text-muted-foreground">Saved in this browser on this device.</p>
      {trips && trips.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
          <MapPinned className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3">No trips yet.</p>
          <Link to="/" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> Plan a trip</Link>
        </div>
      )}
      <ul className="mt-6 grid gap-3">
        {trips?.map((t) => (
          <li key={t.id} className="animate-rise flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <Link to="/trip/$id" params={{ id: t.id }} className="min-w-0 flex-1">
              <div className="truncate font-semibold">{t.title}</div>
              <div className="text-xs text-muted-foreground">{t.stops.length} stops · updated {new Date(t.updatedAt).toLocaleDateString()}</div>
            </Link>
            <button aria-label={`Delete ${t.title}`} onClick={() => { if (confirm(`Delete "${t.title}"?`)) { deleteTrip(t.id); setTrips(loadTrips()); } }}
              className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}
