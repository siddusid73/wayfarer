import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { searchPlaces, type Place, type SearchScope } from "@/lib/geo";

export function PlaceSearch({
  label,
  placeholder,
  value,
  onSelect,
  clearOnSelect,
}: {
  label: string;
  placeholder?: string;
  value?: Place | null;
  clearOnSelect?: boolean;
  onSelect: (p: Place) => void;
}) {
  const id = useId();
  const [q, setQ] = useState(value?.name ?? "");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [scope, setScope] = useState<SearchScope>("india");
  const touched = useRef(false);

  useEffect(() => setQ(value?.name ?? ""), [value?.id]);

  useEffect(() => {
    if (!touched.current || q.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        setResults(await searchPlaces(q, ctrl.signal, scope));
        setActive(0);
        setOpen(true);
      } catch (e) {
        if (!ctrl.signal.aborted)
          setError(e instanceof Error ? e.message : "Search failed — check your connection.");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, scope]);

  const choose = (p: Place) => {
    onSelect(p);
    setQ(clearOnSelect ? "" : p.name);
    setOpen(false);
    touched.current = false;
  };

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
        <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          autoComplete="off"
          value={q}
          placeholder={placeholder}
          onChange={(e) => {
            touched.current = true;
            setQ(e.target.value);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!open || !results.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => (a + 1) % results.length);
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a - 1 + results.length) % results.length);
            }
            if (e.key === "Enter") {
              e.preventDefault();
              choose(results[active]!);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Searching" />
        )}
      </div>
      <label className="mt-1.5 flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
        <input
          type="checkbox"
          checked={scope === "all"}
          onChange={(e) => setScope(e.target.checked ? "all" : "india")}
          className="h-3 w-3 accent-primary"
        />
        Include places outside India (limited coverage — popular destinations only)
      </label>
      <div aria-live="polite" className="sr-only">
        {loading ? "Searching" : open ? `${results.length} results` : ""}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute left-0 top-full z-[1200] mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
        >
          {" "}
          {results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted-foreground">
              No places found. Try a nearby town, add the state, or check spelling.
              {scope === "india"
                ? " Searching India only — tick the box below to look abroad."
                : ""}{" "}
              Coverage varies by region.
            </li>
          ) : (
            results.map((r, i) => (
              <li
                key={r.id}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(r);
                }}
                className={`cursor-pointer px-3 py-2 text-sm ${i === active ? "bg-secondary" : ""}`}
              >
                <div className="font-semibold">{r.name}</div>
                <div className="truncate text-xs text-muted-foreground">{r.detail}</div>
              </li>
            ))
          )}
          <li className="border-t border-border px-3 py-1 text-[10px] text-muted-foreground">
            Search © OpenStreetMap contributors (Nominatim)
          </li>
        </ul>
      )}
    </div>
  );
}
