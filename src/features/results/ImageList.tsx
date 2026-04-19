"use client";
/**
 * ImageList — scrollable list of satellite scenes from STAC search.
 */
import { useCallback } from "react";
import { Cloud, Calendar, Download, Satellite, AlertCircle, Search } from "lucide-react";
import { useAppStore } from "@/lib/store/appStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatDate, cloudCoverColor } from "@/lib/utils";
import { searchScenes, downloadScene } from "@/lib/api/sentinel-hub";
import { EVALSCRIPTS } from "@/features/visualization/constants/evalscripts";
import { useQuery } from "@tanstack/react-query";
import type { Scene } from "@/types";

export default function ImageList() {
  const {
    filters, aoi,
    scenes, selectedScene, totalScenes, isSearching,
    setScenes, selectScene, setSearching,
    visualization, customEvalscript,
  } = useAppStore();

  // TanStack Query for scene search
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["scenes", filters, aoi],
    queryFn: async () => {
      if (!aoi?.bbox) {
        throw new Error("Draw an AOI on the map first to search for images.");
      }
      const result = await searchScenes({
        collections: [filters.collection],
        bbox: aoi.bbox,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        maxCloudCover: filters.maxCloudCover,
        limit: 30,
      });
      setScenes(result.scenes, result.total);
      return result;
    },
    enabled: false, // Manual trigger
    retry: 1,
  });

  const handleSearch = () => refetch();

  const handleDownload = useCallback(async (scene: Scene, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!aoi?.bbox) return;
    const evalscript = visualization === "custom" ? customEvalscript : EVALSCRIPTS[visualization];
    await downloadScene({
      collectionId: scene.collectionId,
      evalscript,
      bbox: aoi.bbox,
      dateFrom: scene.date.slice(0, 10),
      dateTo: scene.date.slice(0, 10),
    }, `geoview_${scene.id.slice(0, 8)}.png`);
  }, [aoi, visualization, customEvalscript]);

  const displayScenes = data?.scenes ?? scenes;

  return (
    <div className="flex flex-col h-full">
      {/* Search trigger */}
      <div className="p-3 border-b border-panel-border">
        <Button
          variant="default"
          size="md"
          onClick={handleSearch}
          disabled={!aoi || isLoading}
          className="w-full gap-2"
        >
          {isLoading
            ? <><div className="h-3.5 w-3.5 rounded-full border-2 border-surface/40 border-t-surface animate-spin" /> Searching…</>
            : <><Search className="h-3.5 w-3.5" /> Search Images</>
          }
        </Button>
        {!aoi && (
          <p className="text-[11px] text-text-muted mt-1.5 text-center">
            Draw an AOI on the map to enable search
          </p>
        )}
      </div>

      {/* Results count */}
      {displayScenes.length > 0 && (
        <div className="px-3 py-2 flex items-center justify-between border-b border-panel-border">
          <span className="text-[11px] text-text-muted">
            <span className="text-text-secondary font-medium">{displayScenes.length}</span>
            {totalScenes > displayScenes.length && ` of ${totalScenes}`} scenes
          </span>
          <Badge variant="cyan">{filters.collection.split("-")[0].toUpperCase()}</Badge>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="m-3 flex items-start gap-2 rounded-md border border-accent-red/20 bg-accent-red/5 p-3">
          <AlertCircle className="h-3.5 w-3.5 text-accent-red mt-0.5 shrink-0" />
          <p className="text-xs text-accent-red/80">
            {error instanceof Error ? error.message : "Search failed. Check your connection."}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && displayScenes.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-12 px-4 text-center">
          <Satellite className="h-8 w-8 text-text-muted" />
          <div>
            <p className="text-sm font-medium text-text-secondary mb-1">No scenes yet</p>
            <p className="text-xs text-text-muted leading-relaxed">
              {aoi
                ? "Adjust filters and click Search Images"
                : "Draw an Area of Interest on the map, then search"
              }
            </p>
          </div>
        </div>
      )}

      {/* Scene list */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col divide-y divide-panel-border">
          {displayScenes.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              isSelected={selectedScene?.id === scene.id}
              onSelect={() => selectScene(selectedScene?.id === scene.id ? null : scene)}
              onDownload={(e) => handleDownload(scene, e)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface SceneCardProps {
  scene: Scene;
  isSelected: boolean;
  onSelect: () => void;
  onDownload: (e: React.MouseEvent) => void;
}

function SceneCard({ scene, isSelected, onSelect, onDownload }: SceneCardProps) {
  const cc = scene.cloudCoverage;
  const ccColor = cloudCoverColor(cc);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-start gap-2.5 p-3 text-left transition-colors",
        isSelected
          ? "bg-accent-cyan/10 border-l-2 border-l-accent-cyan"
          : "hover:bg-panel-hover"
      )}
    >
      {/* Thumbnail */}
      <div className="h-14 w-14 rounded shrink-0 overflow-hidden bg-surface border border-panel-border flex items-center justify-center">
        {scene.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={scene.thumbnailUrl}
            alt={`Scene ${scene.id}`}
            className="h-full w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <Satellite className="h-5 w-5 text-text-muted" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-text-primary">
            {formatDate(scene.date)}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDownload}
            className="shrink-0 text-text-muted hover:text-accent-cyan"
            title="Download scene"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Cloud className="h-3 w-3 shrink-0" style={{ color: ccColor }} />
          <div className="flex-1 h-1 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${cc}%`, backgroundColor: ccColor }}
            />
          </div>
          <span className="text-[11px] font-mono" style={{ color: ccColor }}>
            {cc.toFixed(0)}%
          </span>
        </div>

        <p className="text-[11px] font-mono text-text-muted mt-1 truncate">
          {scene.id.slice(0, 24)}
        </p>
      </div>
    </button>
  );
}
