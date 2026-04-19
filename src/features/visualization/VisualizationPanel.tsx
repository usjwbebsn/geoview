"use client";
/**
 * VisualizationPanel — select rendering mode and adjust opacity.
 */
import { Eye } from "lucide-react";
import { useAppStore } from "@/lib/store/appStore";
import { VISUALIZATIONS } from "@/features/visualization/constants/evalscripts";
import { COLLECTIONS } from "@/features/collections/constants";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import EvalscriptEditor from "./EvalscriptEditor";
import { cn } from "@/lib/utils";

export default function VisualizationPanel() {
  const {
    filters,
    visualization, setVisualization,
    opacity, setOpacity,
  } = useAppStore();

  const collection = COLLECTIONS.find(c => c.id === filters.collection);

  // Filter viz options to those applicable to the current collection
  const applicableViz = VISUALIZATIONS.filter(v =>
    v.applicableCollections.includes(filters.collection)
  );

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-3">
        <p className="text-[11px] font-mono text-text-muted uppercase tracking-wider">Visualization</p>

        {/* Viz selector */}
        <div className="grid grid-cols-2 gap-1.5">
          {applicableViz.map(viz => {
            const isActive = visualization === viz.id;
            return (
              <button
                key={viz.id}
                onClick={() => setVisualization(viz.id)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-md border p-2.5 text-left transition-all",
                  isActive
                    ? "border-accent-cyan/40 bg-accent-cyan/10 text-text-primary"
                    : "border-panel-border bg-surface hover:border-accent-cyan/20 text-text-secondary hover:text-text-primary"
                )}
              >
                <VizIcon id={viz.id} active={isActive} />
                <span className={cn("text-xs font-medium mt-1", isActive && "text-accent-cyan")}>
                  {viz.name}
                </span>
                <span className="text-[10px] text-text-muted leading-tight">{viz.description}</span>
              </button>
            );
          })}
        </div>

        {applicableViz.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">
            No visualizations available for {collection?.name}.
          </p>
        )}

        <Separator />

        {/* Opacity control */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Eye className="h-3.5 w-3.5" />
              <span className="font-medium">Overlay Opacity</span>
            </div>
            <span className="text-xs font-mono text-accent-cyan">{opacity}%</span>
          </div>
          <Slider
            value={[opacity]}
            min={0} max={100} step={5}
            onValueChange={([v]) => setOpacity(v)}
          />
        </div>

        {/* Custom evalscript */}
        {visualization === "custom" && (
          <>
            <Separator />
            <EvalscriptEditor />
          </>
        )}
      </div>
    </ScrollArea>
  );
}

// Mini preview icons for each visualization type
function VizIcon({ id, active }: { id: string; active: boolean }) {
  const color = active ? "#38bdf8" : "#4a5568";
  const previews: Record<string, React.ReactNode> = {
    "true-color": (
      <svg viewBox="0 0 28 14" className="w-7 h-3.5">
        <rect width="10" height="14" fill="#4a90d9" />
        <rect x="10" width="10" height="14" fill="#4caf50" />
        <rect x="20" width="8" height="14" fill="#f5a623" />
      </svg>
    ),
    "false-color": (
      <svg viewBox="0 0 28 14" className="w-7 h-3.5">
        <rect width="14" height="14" fill="#c0392b" />
        <rect x="14" width="14" height="14" fill="#27ae60" />
      </svg>
    ),
    ndvi: (
      <svg viewBox="0 0 28 14" className="w-7 h-3.5">
        {["#8b4513","#cd853f","#90ee90","#228b22","#006400"].map((c, i) => (
          <rect key={i} x={i*5.6} width="5.6" height="14" fill={c} />
        ))}
      </svg>
    ),
    ndwi: (
      <svg viewBox="0 0 28 14" className="w-7 h-3.5">
        <rect width="28" height="14" fill="#1a3a5c" />
        <rect width="12" height="14" fill="#0066cc" />
      </svg>
    ),
    swir: (
      <svg viewBox="0 0 28 14" className="w-7 h-3.5">
        <rect width="28" height="14" fill="#2c1654" />
        <rect width="14" height="14" fill="#8a2be2" />
        <rect width="6" height="14" fill="#ff6347" />
      </svg>
    ),
    "sar-vh": (
      <svg viewBox="0 0 28 14" className="w-7 h-3.5">
        {Array.from({ length: 14 }, (_, i) => (
          <rect key={i} x={i*2} width="2" height="14"
            fill={`hsl(0,0%,${20 + Math.sin(i * 0.9) * 30}%)`} />
        ))}
      </svg>
    ),
    custom: (
      <svg viewBox="0 0 28 14" className="w-7 h-3.5">
        <text x="2" y="11" fontSize="9" fontFamily="monospace" fill={color}>{`<js>`}</text>
      </svg>
    ),
  };

  return (
    <div className="rounded overflow-hidden border border-panel-border">
      {previews[id] ?? <div className="w-7 h-3.5 bg-surface" />}
    </div>
  );
}
