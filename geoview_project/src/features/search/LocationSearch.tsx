"use client";
/**
 * LocationSearch — Nominatim geocoding search bar.
 * Debounced, with keyboard navigation and map fly-to on selection.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store/appStore";
import { geocodeSearch, type GeocodedPlace } from "@/lib/api/geocoding";
import { debounce } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function LocationSearch() {
  const setViewState = useAppStore((s) => s.setViewState);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodedPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced geocode
  const geocode = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || q.length < 2) { setResults([]); setOpen(false); return; }
      setLoading(true);
      try {
        const places = await geocodeSearch(q, 6);
        setResults(places);
        setOpen(places.length > 0);
        setActiveIdx(-1);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }, 400),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    geocode(e.target.value);
  };

  const selectPlace = (place: GeocodedPlace) => {
    setQuery(place.shortName);
    setOpen(false);
    setResults([]);

    // Compute zoom from bbox size
    const lonSpan = Math.abs(place.bbox.east - place.bbox.west);
    const latSpan = Math.abs(place.bbox.north - place.bbox.south);
    const span = Math.max(lonSpan, latSpan);
    const zoom =
      span < 0.05 ? 14 :
      span < 0.3  ? 12 :
      span < 1    ? 10 :
      span < 5    ? 8  :
      span < 20   ? 6  : 4;

    setViewState({ center: [place.lon, place.lat], zoom });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); selectPlace(results[activeIdx]); }
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative flex items-center">
        {loading
          ? <Loader2 className="absolute left-2.5 h-3.5 w-3.5 text-text-muted animate-spin pointer-events-none" />
          : <Search className="absolute left-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
        }
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search location…"
          className={cn(
            "w-full h-8 pl-8 pr-8 rounded-lg border border-panel-border bg-panel/90 backdrop-blur",
            "text-sm text-text-primary placeholder:text-text-muted",
            "focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20",
            "transition-colors"
          )}
        />
        {query && (
          <button
            className="absolute right-2 p-0.5 text-text-muted hover:text-text-secondary transition-colors"
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full rounded-lg border border-panel-border bg-panel shadow-panel overflow-hidden z-50 animate-fade-in">
          {results.map((place, idx) => (
            <button
              key={place.id}
              className={cn(
                "w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors",
                idx === activeIdx
                  ? "bg-panel-hover text-text-primary"
                  : "text-text-secondary hover:bg-panel-hover hover:text-text-primary"
              )}
              onClick={() => selectPlace(place)}
              onMouseEnter={() => setActiveIdx(idx)}
            >
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent-cyan/60" />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{place.shortName}</p>
                <p className="text-[11px] text-text-muted truncate">{place.displayName}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
