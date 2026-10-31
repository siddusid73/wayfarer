import type { Place } from "./geo";

export type Trip = {
  id: string;
  title: string;
  stops: Place[]; // first = start, last = destination
  startDate?: string | undefined;
  days?: number;
  notes?: string;
  updatedAt: number;
};

const KEY = "wayfarer.trips.v1";

export function loadTrips(): Trip[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function persist(trips: Trip[]) {
  localStorage.setItem(KEY, JSON.stringify(trips));
}

export function getTrip(id: string) {
  return loadTrips().find((t) => t.id === id);
}

export function saveTrip(trip: Trip) {
  const all = loadTrips().filter((t) => t.id !== trip.id);
  persist([{ ...trip, updatedAt: Date.now() }, ...all]);
}

export function deleteTrip(id: string) {
  persist(loadTrips().filter((t) => t.id !== id));
}

export function newTripId() {
  return Math.random().toString(36).slice(2, 10);
}

export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [x] = copy.splice(from, 1);
  copy.splice(to, 0, x as T);
  return copy;
}

export function tripToText(t: Trip) {
  const lines = [`${t.title}`, t.startDate ? `Starts ${t.startDate}${t.days ? `, ${t.days} days` : ""}` : "", ""];
  t.stops.forEach((s, i) => lines.push(`${i + 1}. ${s.name} — ${s.detail}`));
  if (t.notes) lines.push("", `Notes: ${t.notes}`);
  return lines.filter((l, i) => l !== "" || i > 0).join("\n");
}
