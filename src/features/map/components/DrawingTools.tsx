"use client";
/**
 * DrawingTools — floating toolbar for AOI drawing.
 * Uses OpenLayers Draw interaction via the global map instance
 * set by MapView on initialization.
 */
import { useEffect, useRef, useCallback } from "react";
import { Square, Hexagon, Trash2, MousePointer } from "lucide-react";
import { useAppStore } from "@/lib/store/appStore";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DrawMode } from "@/types";

export default function DrawingTools() {
  const { drawMode, setDrawMode, setAOI, clearAOI, aoi } = useAppStore();
  const drawInteractionRef = useRef<import("ol/interaction/Draw").default | null>(null);

  // Helper: get global map + source (set by MapView after init)
  const getMapGlobals = useCallback(() => {
    const g = window as unknown as Record<string, unknown>;
    return {
      map: g.__geoview_map as import("ol/Map").default | undefined,
      aoiSource: g.__geoview_aoi_source as import("ol/source/Vector").default | undefined,
    };
  }, []);

  // Activate / deactivate draw interaction
  useEffect(() => {
    const activate = async () => {
      const { map, aoiSource } = getMapGlobals();
      if (!map || !aoiSource) return;

      // Clean up previous interaction
      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current);
        drawInteractionRef.current = null;
      }

      if (drawMode === "none") return;

      const [
        { default: Draw, createBox },
        { Style, Fill, Stroke },
      ] = await Promise.all([
        import("ol/interaction/Draw"),
        import("ol/style"),
      ]);

      aoiSource.clear();

      const drawStyle = new Style({
        fill: new Fill({ color: "rgba(56,189,248,0.1)" }),
        stroke: new Stroke({ color: "#38bdf8", width: 1.5, lineDash: [4, 3] }),
      });

      const draw = new Draw({
        source: aoiSource,
        type: drawMode === "bbox" ? "Circle" : "Polygon",
        ...(drawMode === "bbox" ? { geometryFunction: createBox() } : {}),
        style: drawStyle,
        // Stop after one feature
        condition: () => aoiSource.getFeatures().length === 0,
      });

      draw.on("drawend", async (event) => {
        const feature = event.feature;
        const geom = feature.getGeometry();
        if (!geom) return;

        const { transformExtent } = await import("ol/proj");

        // Get extent and convert to WGS84
        const extent = geom.getExtent();
        const [west, south, east, north] = transformExtent(extent, "EPSG:3857", "EPSG:4326");

        // Build a simple bbox polygon in WGS84
        const bboxGeometry = {
          type: "Polygon" as const,
          coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]],
        };

        setAOI({
          type: drawMode,
          geometry: bboxGeometry,
          bbox: { west, south, east, north },
        });

        // Remove draw interaction
        map.removeInteraction(draw);
        drawInteractionRef.current = null;
      });

      map.addInteraction(draw);
      drawInteractionRef.current = draw;
    };

    // Wait for map to be ready
    const tryActivate = () => {
      const { map } = getMapGlobals();
      if (map) { activate(); }
      else {
        window.addEventListener("geoview:map-ready", activate, { once: true });
      }
    };
    tryActivate();

    return () => {
      window.removeEventListener("geoview:map-ready", activate);
    };
  }, [drawMode, getMapGlobals, setAOI]);

  const handleMode = (mode: DrawMode) => {
    setDrawMode(drawMode === mode ? "none" : mode);
  };

  const handleClear = () => {
    const { aoiSource, map } = getMapGlobals();
    aoiSource?.clear();
    if (map && drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }
    setDrawMode("none");
    clearAOI();
  };

  const tools = [
    { mode: "none" as DrawMode,    icon: MousePointer, label: "Pan / Select" },
    { mode: "bbox" as DrawMode,    icon: Square,       label: "Draw Rectangle AOI" },
    { mode: "polygon" as DrawMode, icon: Hexagon,      label: "Draw Polygon AOI" },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 panel-glass rounded-lg p-1">
        {tools.map(({ mode, icon: Icon, label }) => (
          <Tooltip key={mode}>
            <TooltipTrigger asChild>
              <Button
                variant={drawMode === mode ? "active" : "ghost"}
                size="icon"
                onClick={() => handleMode(mode)}
                aria-label={label}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
          </Tooltip>
        ))}

        {aoi && (
          <>
            <div className="w-px h-5 bg-panel-border mx-0.5" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="danger" size="icon" onClick={handleClear} aria-label="Clear AOI">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Clear AOI</TooltipContent>
            </Tooltip>
          </>
        )}

        {drawMode !== "none" && (
          <div className="ml-2 mr-1 flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-cyan" />
            </span>
            <span className="text-xs text-accent-cyan font-mono">
              {drawMode === "bbox" ? "Click + drag" : "Click points, dbl-click to finish"}
            </span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
