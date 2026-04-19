// ============================================================
// Global TypeScript Types for GeoView
// ============================================================

// --- Geometry ---

export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface Coordinate {
  lon: number;
  lat: number;
}

export type GeoJSONGeometry =
  | { type: "Point"; coordinates: [number, number] }
  | { type: "Polygon"; coordinates: [number, number][][] }
  | { type: "MultiPolygon"; coordinates: [number, number][][][] };

export interface AOI {
  type: "bbox" | "polygon";
  geometry: GeoJSONGeometry;
  bbox?: BBox;
}

// --- Collections ---

export type CollectionId =
  | "sentinel-2-l2a"
  | "sentinel-2-l1c"
  | "sentinel-1-grd"
  | "sentinel-3-olci"
  | "dem"
  | "landsat-8-l2"
  | "modis";

export interface Collection {
  id: CollectionId;
  name: string;
  shortName: string;
  satellite: string;
  resolution: string;
  revisitTime: string;
  description: string;
  bands: Band[];
  defaultVisualization: VisualizationId;
  supportsCloudFilter: boolean;
  color: string; // accent color for UI
}

export interface Band {
  id: string;
  name: string;
  wavelength?: string;
  description: string;
}

// --- Visualization ---

export type VisualizationId =
  | "true-color"
  | "false-color"
  | "ndvi"
  | "ndwi"
  | "swir"
  | "sar-vh"
  | "custom";

export interface Visualization {
  id: VisualizationId;
  name: string;
  description: string;
  evalscript: string;
  applicableCollections: CollectionId[];
}

// --- Scene / Image ---

export interface Scene {
  id: string;
  collectionId: CollectionId;
  date: string; // ISO 8601
  cloudCoverage: number; // 0-100
  thumbnailUrl?: string;
  bbox: BBox;
  resolution?: number;
  productId?: string;
  properties?: Record<string, unknown>;
}

// --- Search Filters ---

export interface SearchFilters {
  collection: CollectionId;
  dateFrom: string; // ISO 8601 date
  dateTo: string;
  maxCloudCover: number; // 0-100
  aoi: AOI | null;
}

// --- Auth ---

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // unix timestamp ms
  tokenType: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

// --- Map State ---

export type DrawMode = "none" | "bbox" | "polygon";

export interface MapViewState {
  center: [number, number]; // [lon, lat]
  zoom: number;
}
