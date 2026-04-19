import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import type { BBox, Coordinate } from "@/types";

// ── Tailwind class merger ────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Date formatting ──────────────────────────────────────────
export function formatDate(iso: string, fmt = "dd MMM yyyy"): string {
  try {
    return format(parseISO(iso), fmt);
  } catch {
    return iso;
  }
}

export function toISODateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

// ── Cloud coverage color ─────────────────────────────────────
export function cloudCoverColor(coverage: number): string {
  if (coverage <= 10) return "#22d3a0";
  if (coverage <= 30) return "#38bdf8";
  if (coverage <= 60) return "#f59e0b";
  return "#f43f5e";
}

// ── BBox helpers ─────────────────────────────────────────────
export function bboxToString(bbox: BBox): string {
  return `${bbox.west.toFixed(4)}, ${bbox.south.toFixed(4)}, ${bbox.east.toFixed(4)}, ${bbox.north.toFixed(4)}`;
}

export function coordinateFromExtent(extent: number[]): Coordinate {
  return {
    lon: (extent[0] + extent[2]) / 2,
    lat: (extent[1] + extent[3]) / 2,
  };
}

// ── Number formatters ────────────────────────────────────────
export function formatKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatArea(sqMeters: number): string {
  if (sqMeters < 1_000_000) return `${Math.round(sqMeters).toLocaleString()} m²`;
  const sqKm = sqMeters / 1_000_000;
  return `${sqKm.toFixed(2)} km²`;
}

// ── Clamp ────────────────────────────────────────────────────
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ── Debounce ─────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// ── URL builders ─────────────────────────────────────────────
export function buildWMSUrl(params: Record<string, string>): string {
  const url = new URL(
    process.env.NEXT_PUBLIC_CDSE_WMS_URL ??
      "https://sh.dataspace.copernicus.eu/ogc/wms"
  );
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

// ── Storage helpers ───────────────────────────────────────────
export function safeLocalGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeLocalSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded – silently ignore */
  }
}
