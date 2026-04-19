"use client";
/**
 * MapLayout — root client component for the map application.
 * Loaded via dynamic import (ssr:false) from the Next.js page.
 *
 * Structure:
 *   <TopBar>  (fixed, z-30, holds search + auth actions)
 *   <LeftPanel> | <MapContainer> | <RightPanel>
 *       └ MapView (OL)
 *       └ DrawingTools (bottom overlay)
 *       └ TimelapsePlayer (conditional overlay)
 */

import Link from "next/link";
import { Globe, Settings, LogIn, LogOut, Satellite } from "lucide-react";
import { useAppStore } from "@/lib/store/appStore";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import LocationSearch from "@/features/search/LocationSearch";
import LeftPanel from "@/features/panels/LeftPanel";
import RightPanel from "@/features/panels/RightPanel";
import MapView from "@/features/map/components/MapView";
import DrawingTools from "@/features/map/components/DrawingTools";
import TimelapsePlayer from "@/features/timelapse/TimelapsePlayer";

export default function MapLayout() {
  const { isAuthenticated, user, logout, timelapseOpen, aoi, filters } = useAppStore();

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex h-screen w-screen overflow-hidden bg-surface font-sans">
        {/* ── Left Panel ───────────────────────────────────── */}
        <LeftPanel />

        {/* ── Map area ─────────────────────────────────────── */}
        <div className="relative flex-1 overflow-hidden">

          {/* Top Bar */}
          <header className="absolute top-0 left-0 right-0 z-30 flex items-center gap-2 px-3 py-2 pointer-events-none">
            {/* Logo */}
            <div className="pointer-events-auto flex items-center gap-2 panel-glass rounded-lg px-3 h-8 shrink-0">
              <Globe className="h-3.5 w-3.5 text-accent-cyan" />
              <span className="text-xs font-semibold text-text-primary tracking-wide">GeoView</span>
            </div>

            {/* Search */}
            <div className="pointer-events-auto flex-1 max-w-sm">
              <LocationSearch />
            </div>

            <div className="flex-1" />

            {/* AOI indicator */}
            {aoi && (
              <div className="pointer-events-auto flex items-center gap-1.5 panel-glass rounded-lg px-2.5 h-8">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-accent-green animate-ping opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-green" />
                </span>
                <span className="text-[11px] text-accent-green font-mono">AOI active</span>
              </div>
            )}

            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/settings" className="pointer-events-auto">
                  <Button variant="ghost" size="icon" className="panel-glass h-8 w-8">
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="pointer-events-auto flex items-center gap-1.5 panel-glass rounded-lg px-2.5 h-8">
                <Satellite className="h-3.5 w-3.5 text-accent-cyan" />
                <span className="text-xs text-text-secondary">{user?.email?.split("@")[0] ?? "user"}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm" onClick={logout}>
                      <LogOut className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sign out</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <Link href="/auth/login" className="pointer-events-auto">
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in
                </Button>
              </Link>
            )}
          </header>

          {/* Map */}
          <MapView />

          {/* Drawing toolbar */}
          <DrawingTools />

          {/* Timelapse player */}
          {timelapseOpen && <TimelapsePlayer />}

          {/* Coordinate / zoom readout */}
          <CoordReadout />
        </div>

        {/* ── Right Panel ──────────────────────────────────── */}
        <RightPanel />
      </div>
    </TooltipProvider>
  );
}

/** Shows current map center coordinates in the bottom-left corner */
function CoordReadout() {
  const { viewState } = useAppStore();
  const [lon, lat] = viewState.center;
  return (
    <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2 panel-glass rounded px-2 py-1 pointer-events-none">
      <span className="text-[10px] font-mono text-text-muted">
        {lat.toFixed(4)}°N, {lon.toFixed(4)}°E · z{viewState.zoom.toFixed(1)}
      </span>
    </div>
  );
}
