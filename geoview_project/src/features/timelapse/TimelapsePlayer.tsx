"use client";
/**
 * TimelapsePlayer — animates through selected scenes in time order.
 * Floating overlay at the bottom of the map.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, SkipBack, SkipForward,
  X, Gauge, Minus, Plus,
} from "lucide-react";
import { useAppStore } from "@/lib/store/appStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const FPS_OPTIONS = [0.5, 1, 2, 4];

export default function TimelapsePlayer() {
  const { scenes, selectedScene, selectScene, toggleTimelapse } = useAppStore();

  // Sort scenes oldest → newest
  const sortedScenes = [...scenes].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fpsIdx, setFpsIdx] = useState(1); // default 1 fps
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fps = FPS_OPTIONS[fpsIdx];
  const totalFrames = sortedScenes.length;
  const currentScene = sortedScenes[frameIdx];

  // Sync scene selection to map
  useEffect(() => {
    if (currentScene) selectScene(currentScene);
  }, [frameIdx, currentScene, selectScene]);

  // Playback loop
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!playing) return;

    intervalRef.current = setInterval(() => {
      setFrameIdx(i => {
        const next = i + 1;
        if (next >= totalFrames) { setPlaying(false); return i; }
        return next;
      });
    }, 1000 / fps);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, fps, totalFrames]);

  const handlePlay = () => setPlaying(p => !p);
  const handlePrev = () => { setPlaying(false); setFrameIdx(i => Math.max(0, i - 1)); };
  const handleNext = () => { setPlaying(false); setFrameIdx(i => Math.min(totalFrames - 1, i + 1)); };
  const handleSlider = ([v]: number[]) => { setPlaying(false); setFrameIdx(v); };

  const handleFpsDown = () => setFpsIdx(i => Math.max(0, i - 1));
  const handleFpsUp   = () => setFpsIdx(i => Math.min(FPS_OPTIONS.length - 1, i + 1));

  if (totalFrames === 0) return null;

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 w-[500px] max-w-[90vw]">
      <div className="panel-glass rounded-xl p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {playing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-amber opacity-75" />}
              <span className={cn("relative inline-flex rounded-full h-2 w-2", playing ? "bg-accent-amber" : "bg-text-muted")} />
            </span>
            <span className="text-xs font-medium text-text-secondary">
              Timelapse · {totalFrames} scenes
            </span>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={toggleTimelapse}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Current date + frame counter */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">
            {currentScene ? formatDate(currentScene.date) : "—"}
          </span>
          <span className="text-xs font-mono text-text-muted">
            {frameIdx + 1} / {totalFrames}
          </span>
        </div>

        {/* Timeline scrubber */}
        <Slider
          value={[frameIdx]}
          min={0}
          max={totalFrames - 1}
          step={1}
          onValueChange={handleSlider}
        />

        {/* Tick marks */}
        <div className="flex justify-between">
          {[0, Math.floor(totalFrames / 2), totalFrames - 1].map(i => (
            <span key={i} className="text-[10px] font-mono text-text-muted">
              {sortedScenes[i] ? formatDate(sortedScenes[i].date, "MMM yy") : ""}
            </span>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrev} disabled={frameIdx === 0}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant={playing ? "active" : "outline"}
              size="icon"
              onClick={handlePlay}
              className="h-9 w-9"
            >
              {playing
                ? <Pause className="h-4 w-4 fill-current" />
                : <Play className="h-4 w-4 fill-current" />
              }
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNext} disabled={frameIdx === totalFrames - 1}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* FPS control */}
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-text-muted" />
            <Button variant="ghost" size="icon-sm" onClick={handleFpsDown} disabled={fpsIdx === 0}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-xs font-mono text-text-secondary w-12 text-center">
              {fps} fps
            </span>
            <Button variant="ghost" size="icon-sm" onClick={handleFpsUp} disabled={fpsIdx === FPS_OPTIONS.length - 1}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Scene strip */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {sortedScenes.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => { setPlaying(false); setFrameIdx(idx); }}
              className={cn(
                "shrink-0 h-8 w-8 rounded overflow-hidden border transition-all",
                idx === frameIdx
                  ? "border-accent-cyan ring-1 ring-accent-cyan/30"
                  : "border-panel-border opacity-50 hover:opacity-80"
              )}
            >
              {scene.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={scene.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-surface" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
