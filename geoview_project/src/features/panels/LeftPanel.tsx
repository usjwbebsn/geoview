"use client";
/**
 * LeftPanel — Collections, Filters, and Drawing controls.
 */
import { useState } from "react";
import {
  Layers, SlidersHorizontal, PenTool, ChevronLeft,
  Cloud, Calendar, Info, CheckCircle2
} from "lucide-react";
import { useAppStore } from "@/lib/store/appStore";
import { COLLECTIONS } from "@/features/collections/constants";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { SearchFilters } from "@/types";
import { cn, formatDate, bboxToString } from "@/lib/utils";
import type { DrawMode } from "@/types";

type Tab = "collections" | "filters" | "drawing";

const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: "collections", icon: Layers,           label: "Collections" },
  { id: "filters",     icon: SlidersHorizontal, label: "Filters" },
  { id: "drawing",     icon: PenTool,           label: "AOI" },
];

export default function LeftPanel() {
  const {
    leftPanelOpen, toggleLeftPanel,
    filters, setCollection, setDateFrom, setDateTo, setMaxCloudCover, resetFilters,
    drawMode, setDrawMode, aoi, clearAOI,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<Tab>("collections");

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "relative flex h-full flex-col border-r border-panel-border bg-panel/95 backdrop-blur transition-all duration-300 z-20",
          leftPanelOpen ? "w-72" : "w-12"
        )}
      >
        {/* Collapse toggle */}
        <button
          onClick={toggleLeftPanel}
          className={cn(
            "absolute -right-3 top-16 z-30 flex h-6 w-6 items-center justify-center rounded-full",
            "border border-panel-border bg-panel shadow-panel-sm text-text-muted hover:text-text-primary transition-colors"
          )}
        >
          <ChevronLeft className={cn("h-3 w-3 transition-transform duration-300", !leftPanelOpen && "rotate-180")} />
        </button>

        {/* Tab icons (always visible) */}
        <div className="flex flex-col gap-0.5 p-2 border-b border-panel-border">
          {TABS.map(({ id, icon: Icon, label }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { setActiveTab(id); if (!leftPanelOpen) toggleLeftPanel(); }}
                  className={cn(
                    "flex items-center gap-2.5 rounded px-2 py-1.5 text-xs transition-colors",
                    activeTab === id && leftPanelOpen
                      ? "bg-panel-hover text-text-primary"
                      : "text-text-muted hover:text-text-primary hover:bg-panel-hover"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {leftPanelOpen && <span className="font-medium">{label}</span>}
                </button>
              </TooltipTrigger>
              {!leftPanelOpen && <TooltipContent side="right">{label}</TooltipContent>}
            </Tooltip>
          ))}
        </div>

        {/* Panel body */}
        {leftPanelOpen && (
          <ScrollArea className="flex-1">
            <div className="p-3">
              {activeTab === "collections" && <CollectionsTab />}
              {activeTab === "filters" && (
                <FiltersTab
                  filters={filters}
                  setDateFrom={setDateFrom}
                  setDateTo={setDateTo}
                  setMaxCloudCover={setMaxCloudCover}
                  resetFilters={resetFilters}
                />
              )}
              {activeTab === "drawing" && (
                <DrawingTab drawMode={drawMode} setDrawMode={setDrawMode} aoi={aoi} clearAOI={clearAOI} />
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </TooltipProvider>
  );
}

// ── Collections Tab ────────────────────────────────────────────
function CollectionsTab() {
  const { filters, setCollection } = useAppStore();

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-2">
        Data Source
      </p>
      {COLLECTIONS.map((col) => {
        const isActive = filters.collection === col.id;
        return (
          <button
            key={col.id}
            onClick={() => setCollection(col.id)}
            className={cn(
              "w-full flex items-start gap-2.5 rounded-md p-2.5 text-left transition-colors border",
              isActive
                ? "bg-panel-hover border-accent-cyan/30 text-text-primary"
                : "border-transparent hover:bg-panel-hover hover:border-panel-border text-text-secondary"
            )}
          >
            {/* Color dot */}
            <div
              className="mt-0.5 h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: col.color, boxShadow: isActive ? `0 0 6px ${col.color}80` : "none" }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-medium">{col.shortName}</span>
                {isActive && <CheckCircle2 className="h-3 w-3 text-accent-cyan" />}
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">{col.description}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant="muted">{col.resolution}</Badge>
                <Badge variant="muted">{col.revisitTime}</Badge>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Filters Tab ────────────────────────────────────────────────
interface FiltersTabProps {
  filters: SearchFilters;
  setDateFrom: (d: string) => void;
  setDateTo: (d: string) => void;
  setMaxCloudCover: (v: number) => void;
  resetFilters: () => void;
}

function FiltersTab({ filters, setDateFrom, setDateTo, setMaxCloudCover, resetFilters }: FiltersTabProps) {
  const collection = COLLECTIONS.find(c => c.id === filters.collection);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] font-mono text-text-muted uppercase tracking-wider">Search Filters</p>

      {/* Date range */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Calendar className="h-3.5 w-3.5" />
          <span className="font-medium">Date Range</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-text-muted mb-1 block">From</label>
            <input
              type="date"
              value={filters.dateFrom}
              max={filters.dateTo}
              onChange={e => setDateFrom(e.target.value)}
              className={cn(
                "w-full h-7 px-2 rounded border border-panel-border bg-surface/50",
                "text-xs text-text-primary focus:outline-none focus:border-accent-cyan/50",
                "color-scheme-dark"
              )}
            />
          </div>
          <div>
            <label className="text-[11px] text-text-muted mb-1 block">To</label>
            <input
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom}
              max={new Date().toISOString().slice(0, 10)}
              onChange={e => setDateTo(e.target.value)}
              className="w-full h-7 px-2 rounded border border-panel-border bg-surface/50 text-xs text-text-primary focus:outline-none focus:border-accent-cyan/50"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Cloud cover */}
      {collection?.supportsCloudFilter ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Cloud className="h-3.5 w-3.5" />
              <span className="font-medium">Max Cloud Cover</span>
            </div>
            <span className="text-xs font-mono text-accent-cyan">{filters.maxCloudCover}%</span>
          </div>
          <Slider
            value={[filters.maxCloudCover]}
            min={0} max={100} step={5}
            onValueChange={([v]) => setMaxCloudCover(v)}
          />
          <div className="flex justify-between text-[11px] text-text-muted">
            <span>0% clear</span>
            <span>100% any</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md p-2.5 bg-surface border border-panel-border">
          <Info className="h-3.5 w-3.5 text-text-muted shrink-0" />
          <p className="text-[11px] text-text-muted">
            Cloud filter not applicable for {collection?.name ?? "this collection"} (SAR/DEM).
          </p>
        </div>
      )}

      <Separator />

      <Button variant="outline" size="sm" onClick={resetFilters} className="w-full">
        Reset Filters
      </Button>
    </div>
  );
}

// ── Drawing Tab ────────────────────────────────────────────────
interface DrawingTabProps {
  drawMode: DrawMode;
  setDrawMode: (m: DrawMode) => void;
  aoi: ReturnType<typeof useAppStore>["aoi"];
  clearAOI: () => void;
}

function DrawingTab({ drawMode, setDrawMode, aoi, clearAOI }: DrawingTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] font-mono text-text-muted uppercase tracking-wider">Area of Interest</p>
      <p className="text-xs text-text-muted leading-relaxed">
        Draw an AOI on the map to spatially constrain your image search.
        Only scenes intersecting the AOI will be returned.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setDrawMode(drawMode === "bbox" ? "none" : "bbox")}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-md border p-3 transition-colors text-xs",
            drawMode === "bbox"
              ? "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan"
              : "border-panel-border bg-surface hover:border-accent-cyan/20 text-text-secondary"
          )}
        >
          <div className="h-8 w-8 rounded border-2 border-current" />
          <span className="font-medium">Rectangle</span>
        </button>
        <button
          onClick={() => setDrawMode(drawMode === "polygon" ? "none" : "polygon")}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-md border p-3 transition-colors text-xs",
            drawMode === "polygon"
              ? "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan"
              : "border-panel-border bg-surface hover:border-accent-cyan/20 text-text-secondary"
          )}
        >
          <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="16,4 28,12 24,26 8,26 4,12" />
          </svg>
          <span className="font-medium">Polygon</span>
        </button>
      </div>

      {aoi && (
        <div className="rounded-md border border-accent-green/20 bg-accent-green/5 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-accent-green">AOI Active</span>
            <Button variant="ghost" size="icon-sm" onClick={clearAOI} className="text-text-muted">
              ×
            </Button>
          </div>
          {aoi.bbox && (
            <p className="text-[11px] font-mono text-text-muted leading-relaxed break-all">
              {bboxToString(aoi.bbox)}
            </p>
          )}
        </div>
      )}

      {drawMode !== "none" && (
        <div className="flex items-center gap-2 rounded-md p-2.5 bg-accent-cyan/5 border border-accent-cyan/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan" />
          </span>
          <p className="text-xs text-accent-cyan">
            {drawMode === "bbox" ? "Click and drag on the map" : "Click to add points, double-click to finish"}
          </p>
        </div>
      )}
    </div>
  );
}
