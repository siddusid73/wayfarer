import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sun, Moon, Sunset } from "lucide-react";

const THEMES = [
  { id: "daylight", label: "Daylight", Icon: Sun },
  { id: "dusk", label: "Dusk", Icon: Moon },
  { id: "sunset", label: "Sunset", Icon: Sunset },
] as const;

export function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <circle cx="16" cy="16" r="15" className="fill-primary" />
      <path d="M7 22c4-1 5-8 9-8s5 6 9 4" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-primary-foreground" strokeDasharray="0.1 4.5" />
      <circle cx="24" cy="11" r="3" className="fill-accent" />
    </svg>
  );
}

export function SiteHeader() {
  const [theme, setTheme] = useState("sunset");
  useEffect(() => { setTheme(localStorage.getItem("wayfarer.theme") || "sunset"); }, []);
  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
    localStorage.setItem("wayfarer.theme", theme);
  }, [theme]);

  return (
    <header className="sticky top-0 z-[1100] border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <Logo /> Wayfarer
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-4">
          <Link to="/" className="rounded-md px-2 py-1 hover:bg-secondary" activeProps={{ className: "font-bold text-primary" }} activeOptions={{ exact: true }}>Plan</Link>
          <Link to="/trips" className="rounded-md px-2 py-1 hover:bg-secondary" activeProps={{ className: "font-bold text-primary" }}>My trips</Link>
          <div role="radiogroup" aria-label="Theme" className="flex rounded-full border border-border bg-card p-0.5">
            {THEMES.map(({ id, label, Icon }) => (
              <button key={id} role="radio" aria-checked={theme === id} aria-label={label} title={label}
                onClick={() => setTheme(id)}
                className={`rounded-full p-1.5 transition-colors ${theme === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
