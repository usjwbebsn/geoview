"use client";
/**
 * MapView — OpenLayers map component.
 *
 * Layers (bottom to top):
 *  1. OSM raster base layer (CartoDB dark style via tile URL)
 *  2. WMS overlay (Sentinel Hub / CDSE) — only when instance ID is configured
 *  3. Vector layer — AOI drawing + highlighted scenes
 *
 * The map syncs with the Zustand store (viewState) bidirectionally.
 */
import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/lib/store/appStore";
import { buildWMSTileUrl, getWMSParams } from "@/lib/api/sentinel-hub";

// ── Types for OL (imported dynamically inside useEffect) ───────
type OLMap = import("ol/Map").default;

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OLMap | null>(null);
  const wmsLayerRef = useRef<import("ol/layer/Tile").default<import("ol/source/TileWMS").default> | null>(null);
  const drawInteractionRef = useRef<import("ol/interaction/Draw").default | null>(null);
  const aoiLayerRef = useRef<import("ol/layer/Vector").default<import("ol/source/Vector").default> | null>(null);

  const {
    viewState, setViewState,
    drawMode, setDrawMode,
    setAOI,
    filters,
    visualization,
    opacity,
    selectedScene,
  } = useAppStore();

  // ── Initialize map ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    async function initMap() {
      const [
        { default: Map },
        { default: View },
        { default: TileLayer },
        { default: VectorLayer },
        { default: VectorSource },
        { default: XYZ },
        { fromLonLat, toLonLat },
        { Style, Fill, Stroke },
        { ScaleLine, Attribution },
      ] = await Promise.all([
        import("ol/Map"),
        import("ol/View"),
        import("ol/layer/Tile"),
        import("ol/layer/Vector"),
        import("ol/source/Vector"),
        import("ol/source/XYZ"),
        import("ol/proj"),
        import("ol/style"),
        import("ol/control"),
      ]);

      if (cancelled || !mapRef.current) return;

      // Dark CartoDB base layer
      const baseLayer = new TileLayer({
        source: new XYZ({
          url: "https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          attributions: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com">CARTO</a>',
          maxZoom: 19,
        }),
        zIndex: 0,
      });

      // AOI vector layer
      const aoiSource = new VectorSource();
      const aoiLayer = new VectorLayer({
        source: aoiSource,
        style: new Style({
          fill: new Fill({ color: "rgba(56,189,248,0.08)" }),
          stroke: new Stroke({ color: "#38bdf8", width: 1.5, lineDash: [4, 4] }),
        }),
        zIndex: 10,
      });
      aoiLayerRef.current = aoiLayer;

      const [centerX, centerY] = fromLonLat(viewState.center);

      const map = new Map({
        target: mapRef.current!,
        layers: [baseLayer, aoiLayer],
        view: new View({
          center: [centerX, centerY],
          zoom: viewState.zoom,
          minZoom: 2,
          maxZoom: 18,
        }),
        controls: [
          new Attribution({ collapsed: false, collapsible: false }),
          new ScaleLine({ units: "metric", minWidth: 60 }),
        ],
      });

      mapInstanceRef.current = map;

      // Sync map view → store
      map.getView().on("change", () => {
        const center = toLonLat(map.getView().getCenter()!);
        const zoom = map.getView().getZoom() ?? 3;
        setViewState({ center: [center[0], center[1]], zoom });
      });

      // Expose map instance globally for DrawingTools to access
      (window as unknown as Record<string, unknown>).__geoview_map = map;
      (window as unknown as Record<string, unknown>).__geoview_aoi_source = aoiSource;
      window.dispatchEvent(new Event("geoview:map-ready"));
    }

    initMap();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync store viewState → map (external navigation) ──────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    import("ol/proj").then(({ fromLonLat }) => {
      const view = map.getView();
      const currentCenter = view.getCenter();
      const targetCenter = fromLonLat(viewState.center);
      // Only animate if meaningfully different (avoid feedback loop)
      const dist = currentCenter
        ? Math.hypot(currentCenter[0] - targetCenter[0], currentCenter[1] - targetCenter[1])
        : Infinity;
      if (dist > 100) {
        view.animate({ center: targetCenter, zoom: viewState.zoom, duration: 600 });
      }
    });
  }, [viewState]);

  // ── WMS satellite overlay layer ────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const instanceId = process.env.NEXT_PUBLIC_SH_INSTANCE_ID;
    if (!instanceId || instanceId === "YOUR_INSTANCE_ID") return; // no-op in demo mode

    import("ol/layer/Tile").then(({ default: TileLayer }) =>
      import("ol/source/TileWMS").then(({ default: TileWMS }) => {
        // Remove old WMS layer
        if (wmsLayerRef.current) {
          map.removeLayer(wmsLayerRef.current);
        }

        const wmsLayer = new TileLayer({
          source: new TileWMS({
            url: buildWMSTileUrl(filters.collection, visualization, instanceId),
            params: getWMSParams(
              filters.collection,
              visualization,
              filters.dateFrom,
              filters.dateTo
            ),
            serverType: "geoserver",
            crossOrigin: "anonymous",
          }),
          opacity: opacity / 100,
          zIndex: 5,
        });

        map.addLayer(wmsLayer);
        wmsLayerRef.current = wmsLayer;
      })
    );
  }, [filters.collection, filters.dateFrom, filters.dateTo, visualization, opacity]);

  // ── Opacity update without rebuilding layer ────────────────
  useEffect(() => {
    if (wmsLayerRef.current) {
      wmsLayerRef.current.setOpacity(opacity / 100);
    }
  }, [opacity]);

  // ── Handle selectedScene → fly to its BBox ─────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedScene) return;

    import("ol/proj").then(({ transformExtent }) => {
      const { west, south, east, north } = selectedScene.bbox;
      const extent = transformExtent([west, south, east, north], "EPSG:4326", "EPSG:3857");
      map.getView().fit(extent, { duration: 600, padding: [80, 80, 80, 80], maxZoom: 12 });
    });
  }, [selectedScene]);

  return (
    <div
      ref={mapRef}
      id="map"
      className="absolute inset-0 w-full h-full"
    />
  );
}
