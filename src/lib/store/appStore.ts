/**
 * Global app state — Zustand store with Immer for immutable updates.
 * Split into logical slices: auth, map, filters, ui.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type {
  AuthToken,
  User,
  MapViewState,
  SearchFilters,
  DrawMode,
  AOI,
  CollectionId,
  VisualizationId,
  Scene,
} from "@/types";
import { toISODateString } from "@/lib/utils";

// ── Default values ─────────────────────────────────────────────

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 30);

const DEFAULT_FILTERS: SearchFilters = {
  collection: "sentinel-2-l2a",
  dateFrom: toISODateString(thirtyDaysAgo),
  dateTo: toISODateString(today),
  maxCloudCover: 30,
  aoi: null,
};

const DEFAULT_MAP_VIEW: MapViewState = {
  center: [0, 20],
  zoom: 3,
};

// ── Store shape ────────────────────────────────────────────────

interface AuthSlice {
  token: AuthToken | null;
  user: User | null;
  isAuthenticated: boolean;
  setToken: (token: AuthToken | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

interface MapSlice {
  viewState: MapViewState;
  drawMode: DrawMode;
  aoi: AOI | null;
  setViewState: (vs: MapViewState) => void;
  setDrawMode: (mode: DrawMode) => void;
  setAOI: (aoi: AOI | null) => void;
  clearAOI: () => void;
}

interface FiltersSlice {
  filters: SearchFilters;
  setCollection: (c: CollectionId) => void;
  setDateFrom: (d: string) => void;
  setDateTo: (d: string) => void;
  setMaxCloudCover: (v: number) => void;
  resetFilters: () => void;
}

interface VisualizationSlice {
  visualization: VisualizationId;
  customEvalscript: string;
  opacity: number;
  setVisualization: (v: VisualizationId) => void;
  setCustomEvalscript: (s: string) => void;
  setOpacity: (o: number) => void;
}

interface ResultsSlice {
  scenes: Scene[];
  selectedScene: Scene | null;
  totalScenes: number;
  isSearching: boolean;
  setScenes: (scenes: Scene[], total: number) => void;
  selectScene: (scene: Scene | null) => void;
  setSearching: (v: boolean) => void;
}

interface UISlice {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  timelapseOpen: boolean;
  activeLeftTab: "collections" | "filters" | "drawing";
  activeRightTab: "results" | "visualization";
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleTimelapse: () => void;
  setLeftTab: (tab: UISlice["activeLeftTab"]) => void;
  setRightTab: (tab: UISlice["activeRightTab"]) => void;
}

export type AppStore = AuthSlice &
  MapSlice &
  FiltersSlice &
  VisualizationSlice &
  ResultsSlice &
  UISlice;

// ── Store implementation ───────────────────────────────────────

export const useAppStore = create<AppStore>()(
  persist(
    immer((set) => ({
      // ── Auth ─────────────────────────────────────────────────
      token: null,
      user: null,
      isAuthenticated: false,
      setToken: (token) =>
        set((s) => {
          s.token = token;
          s.isAuthenticated = token !== null;
        }),
      setUser: (user) =>
        set((s) => {
          s.user = user;
        }),
      logout: () =>
        set((s) => {
          s.token = null;
          s.user = null;
          s.isAuthenticated = false;
        }),

      // ── Map ───────────────────────────────────────────────────
      viewState: DEFAULT_MAP_VIEW,
      drawMode: "none",
      aoi: null,
      setViewState: (vs) =>
        set((s) => {
          s.viewState = vs;
        }),
      setDrawMode: (mode) =>
        set((s) => {
          s.drawMode = mode;
        }),
      setAOI: (aoi) =>
        set((s) => {
          s.aoi = aoi;
          s.filters.aoi = aoi;
          // Snap draw mode back to none
          s.drawMode = "none";
        }),
      clearAOI: () =>
        set((s) => {
          s.aoi = null;
          s.filters.aoi = null;
        }),

      // ── Filters ───────────────────────────────────────────────
      filters: DEFAULT_FILTERS,
      setCollection: (c) =>
        set((s) => {
          s.filters.collection = c;
        }),
      setDateFrom: (d) =>
        set((s) => {
          s.filters.dateFrom = d;
        }),
      setDateTo: (d) =>
        set((s) => {
          s.filters.dateTo = d;
        }),
      setMaxCloudCover: (v) =>
        set((s) => {
          s.filters.maxCloudCover = v;
        }),
      resetFilters: () =>
        set((s) => {
          s.filters = DEFAULT_FILTERS;
        }),

      // ── Visualization ─────────────────────────────────────────
      visualization: "true-color",
      customEvalscript: "",
      opacity: 100,
      setVisualization: (v) =>
        set((s) => {
          s.visualization = v;
        }),
      setCustomEvalscript: (script) =>
        set((s) => {
          s.customEvalscript = script;
        }),
      setOpacity: (o) =>
        set((s) => {
          s.opacity = o;
        }),

      // ── Results ───────────────────────────────────────────────
      scenes: [],
      selectedScene: null,
      totalScenes: 0,
      isSearching: false,
      setScenes: (scenes, total) =>
        set((s) => {
          s.scenes = scenes;
          s.totalScenes = total;
        }),
      selectScene: (scene) =>
        set((s) => {
          s.selectedScene = scene;
        }),
      setSearching: (v) =>
        set((s) => {
          s.isSearching = v;
        }),

      // ── UI ────────────────────────────────────────────────────
      leftPanelOpen: true,
      rightPanelOpen: true,
      timelapseOpen: false,
      activeLeftTab: "collections",
      activeRightTab: "results",
      toggleLeftPanel: () =>
        set((s) => {
          s.leftPanelOpen = !s.leftPanelOpen;
        }),
      toggleRightPanel: () =>
        set((s) => {
          s.rightPanelOpen = !s.rightPanelOpen;
        }),
      toggleTimelapse: () =>
        set((s) => {
          s.timelapseOpen = !s.timelapseOpen;
        }),
      setLeftTab: (tab) =>
        set((s) => {
          s.activeLeftTab = tab;
        }),
      setRightTab: (tab) =>
        set((s) => {
          s.activeRightTab = tab;
        }),
    })),
    {
      name: "geoview-store",
      // Only persist non-sensitive state
      partialize: (s) => ({
        viewState: s.viewState,
        filters: { ...s.filters, aoi: null },
        visualization: s.visualization,
        customEvalscript: s.customEvalscript,
        opacity: s.opacity,
        leftPanelOpen: s.leftPanelOpen,
        rightPanelOpen: s.rightPanelOpen,
      }),
    }
  )
);
