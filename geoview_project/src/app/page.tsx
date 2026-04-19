import dynamic from "next/dynamic";

/**
 * Main map page.
 * MapLayout is dynamically imported with ssr:false because OpenLayers
 * is a browser-only library and will fail during SSR.
 */
const MapLayout = dynamic(
  () => import("@/features/layout/MapLayout"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-[#090b0e]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-panel-border border-t-accent-cyan animate-spin" />
          <p className="text-xs font-mono text-text-muted tracking-widest uppercase">
            Loading GeoView
          </p>
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  return <MapLayout />;
}
