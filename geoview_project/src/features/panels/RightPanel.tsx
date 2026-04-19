"use client";
/**
 * RightPanel — Results list + Visualization controls.
 */
import { useState } from "react";
import { Image, Eye, ChevronRight, Play } from "lucide-react";
import { useAppStore } from "@/lib/store/appStore";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import ImageList from "@/features/results/ImageList";
import VisualizationPanel from "@/features/visualization/VisualizationPanel";

type Tab = "results" | "visualization";

const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: "results",       icon: Image, label: "Images" },
  { id: "visualization", icon: Eye,   label: "Visualization" },
];

export default function RightPanel() {
  const { rightPanelOpen, toggleRightPanel, toggleTimelapse, scenes } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>("results");

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "relative flex h-full flex-col border-l border-panel-border bg-panel/95 backdrop-blur transition-all duration-300 z-20",
          rightPanelOpen ? "w-72" : "w-12"
        )}
      >
        {/* Collapse toggle */}
        <button
          onClick={toggleRightPanel}
          className={cn(
            "absolute -left-3 top-16 z-30 flex h-6 w-6 items-center justify-center rounded-full",
            "border border-panel-border bg-panel shadow-panel-sm text-text-muted hover:text-text-primary transition-colors"
          )}
        >
          <ChevronRight className={cn("h-3 w-3 transition-transform duration-300", !rightPanelOpen && "rotate-180")} />
        </button>

        {/* Tab icons */}
        <div className="flex flex-col gap-0.5 p-2 border-b border-panel-border">
          {TABS.map(({ id, icon: Icon, label }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { setActiveTab(id); if (!rightPanelOpen) toggleRightPanel(); }}
                  className={cn(
                    "flex items-center gap-2.5 rounded px-2 py-1.5 text-xs transition-colors",
                    activeTab === id && rightPanelOpen
                      ? "bg-panel-hover text-text-primary"
                      : "text-text-muted hover:text-text-primary hover:bg-panel-hover"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {rightPanelOpen && <span className="font-medium">{label}</span>}
                </button>
              </TooltipTrigger>
              {!rightPanelOpen && <TooltipContent side="left">{label}</TooltipContent>}
            </Tooltip>
          ))}

          {/* Timelapse button */}
          {rightPanelOpen && scenes.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTimelapse}
              className="mt-1 gap-1.5 text-accent-amber hover:text-accent-amber hover:bg-accent-amber/10"
            >
              <Play className="h-3 w-3 fill-current" />
              Timelapse ({scenes.length})
            </Button>
          )}
        </div>

        {/* Panel body */}
        {rightPanelOpen && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === "results"       && <ImageList />}
            {activeTab === "visualization" && <VisualizationPanel />}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
