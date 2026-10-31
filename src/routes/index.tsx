import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Compass,
  Mountain,
  Waves,
  Trees,
  Search,
  Route as RouteIcon,
  Bookmark,
} from "lucide-react";
import hero from "@/assets/hero-road.jpg";
import { PlaceSearch } from "@/components/PlaceSearch";
import type { Place } from "@/lib/geo";
import { newTripId, saveTrip } from "@/lib/trips";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wayfarer — Plan a road trip across India" },
      {
        name: "description",
        content:
          "Search destinations across every Indian state and union territory, add stops and get a driving route with stays, food and viewpoints along the way.",
      },
      { property: "og:title", content: "Wayfarer — Plan a road trip across India" },
      {
        property: "og:description",
        content: "Search destinations across India and build a road trip route with stops.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const IDEAS = [
  {
    title: "Coastal drives",
    text: "Sea-link highways and beach towns.",
    Icon: Waves,
    from: "Mumbai, Maharashtra",
    to: "Goa",
  },
  {
    title: "Himalayan passes",
    text: "Switchbacks, monasteries and high valleys.",
    Icon: Mountain,
    from: "Manali, Himachal Pradesh",
    to: "Leh, Ladakh",
  },
  {
    title: "Forest escapes",
    text: "Quiet roads through ghats and national parks.",
    Icon: Trees,
    from: "Bengaluru, Karnataka",
    to: "Coorg, Karnataka",
  },
  {
    title: "Desert classics",
    text: "Long horizons, forts and dune country.",
    Icon: Compass,
    from: "Jaipur, Rajasthan",
    to: "Jaisalmer, Rajasthan",
  },
];

function Index() {
  const navigate = useNavigate();
  const [start, setStart] = useState<Place | null>(null);
  const [dest, setDest] = useState<Place | null>(null);
  const [date, setDate] = useState("");
  const [days, setDays] = useState("");
  const [err, setErr] = useState("");

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !dest) {
      setErr("Choose a start and destination from the suggestions.");
      return;
    }
    const id = newTripId();
    saveTrip({
      id,
      title: `${start.name} to ${dest.name}`,
      stops: [start, dest],
      ...(date ? { startDate: date } : {}),
      ...(days !== "" ? { days: Number(days) } : {}),
      updatedAt: Date.now(),
    });
    navigate({ to: "/trip/$id", params: { id } });
  };

  return (
    <div>
      <section className="relative isolate">
        {" "}
        <img
          src={hero}
          alt="Coastal road at sunset"
          width={1920}
          height={1088}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="hero-overlay absolute inset-0 -z-10" />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:pt-28">
          <h1 className="animate-rise max-w-2xl text-4xl font-bold leading-tight text-primary-foreground sm:text-6xl">
            India, the long way round.
          </h1>
          <p className="animate-rise mt-4 max-w-lg text-primary-foreground/90 [animation-delay:80ms]">
            Search any Indian town, city or landmark — every state and union territory — add stops,
            and get a driving route with places to sleep, eat and stop along the way.
          </p>
          <form
            onSubmit={create}
            className="animate-rise mt-8 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl [animation-delay:160ms] sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(130px,auto)_80px_auto] lg:items-end"
          >
            <PlaceSearch
              label="Starting point"
              placeholder="e.g. Delhi"
              value={start}
              onSelect={(p) => {
                setStart(p);
                setErr("");
              }}
            />
            <PlaceSearch
              label="Destination"
              placeholder="e.g. Manali"
              value={dest}
              onSelect={(p) => {
                setDest(p);
                setErr("");
              }}
            />
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Start date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block h-11 w-full rounded-lg border border-input bg-card px-3 text-sm normal-case text-foreground"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Days
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={days}
                onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))}
                className="mt-1 block h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground lg:w-20"
              />
            </label>
            <button
              type="submit"
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95"
            >
              Plan route <ArrowRight className="h-4 w-4" />
            </button>
            {err && (
              <p role="alert" className="text-sm text-destructive sm:col-span-2 lg:col-span-5">
                {err}
              </p>
            )}
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              Icon: Search,
              t: "Search",
              d: "Type a place anywhere in India — suggestions come from OpenStreetMap data, with the state shown so you can tell similar names apart.",
            },
            {
              Icon: RouteIcon,
              t: "Route",
              d: "Add, reorder or remove stops and see distance and estimated drive time.",
            },
            {
              Icon: Bookmark,
              t: "Save & share",
              d: "Trips are saved on this device. Copy or download your itinerary.",
            },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="rounded-xl border border-border bg-card p-5">
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold">Road trip ideas in India</h2>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
            Editorial picks — not live results
          </span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {IDEAS.map(({ title, text, Icon, from, to }) => (
            <article
              key={title}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <Icon className="h-7 w-7 text-accent" />
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              <p className="mt-3 text-xs font-medium text-primary">
                Try: {from} → {to}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="rounded-xl border border-border bg-muted p-5 text-sm text-muted-foreground">
          <strong className="text-foreground">About coverage.</strong> Search covers all of India —
          states, union territories, cities, towns, landmarks and attractions — via OpenStreetMap
          data. Results depend on that data source and may not include every small or newly added
          place. Popular international destinations are available as a secondary option (tick
          “Include places outside India” in the search box); this is not complete worldwide
          coverage.
        </div>
      </section>
    </div>
  );
}
