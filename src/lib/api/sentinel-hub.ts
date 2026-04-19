/**
 * Sentinel Hub / Copernicus Data Space Ecosystem
 * ─────────────────────────────────────────────────
 * Covers:
 *   - OGC WMS / WMTS tile URLs (for OpenLayers)
 *   - Process API (rendered imagery)
 *   - STAC Catalog API (scene search)
 *
 * API docs:
 *   https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Process/Processing.html
 *   https://documentation.dataspace.copernicus.eu/APIs/STAC.html
 */

import type {
  BBox,
  CollectionId,
  Scene,
  SearchFilters,
  VisualizationId,
} from "@/types";
import { authHeader, getCachedToken } from "./copernicus-auth";

const PROCESS_API =
  process.env.NEXT_PUBLIC_CDSE_PROCESS_API ??
  "https://sh.dataspace.copernicus.eu/api/v1/process";

const CATALOG_API =
  process.env.NEXT_PUBLIC_CDSE_CATALOG_API ??
  "https://catalogue.dataspace.copernicus.eu/stac";

const WMS_BASE =
  process.env.NEXT_PUBLIC_CDSE_WMS_URL ??
  "https://sh.dataspace.copernicus.eu/ogc/wms";

// ── STAC collection ID mapping ────────────────────────────────
const STAC_COLLECTION_MAP: Record<CollectionId, string> = {
  "sentinel-2-l2a": "SENTINEL-2",
  "sentinel-2-l1c": "SENTINEL-2",
  "sentinel-1-grd": "SENTINEL-1",
  "sentinel-3-olci": "SENTINEL-3",
  dem: "COP-DEM",
  "landsat-8-l2": "LANDSAT-8",
  modis: "MODIS",
};

// ── SH collection names (for Process API) ─────────────────────
const SH_COLLECTION_MAP: Record<CollectionId, string> = {
  "sentinel-2-l2a": "sentinel-2-l2a",
  "sentinel-2-l1c": "sentinel-2-l1c",
  "sentinel-1-grd": "sentinel-1-grd",
  "sentinel-3-olci": "sentinel-3-olci",
  dem: "dem-copernicus",
  "landsat-8-l2": "landsat-ot-l2",
  modis: "modis",
};

// ────────────────────────────────────────────────────────────────
//  WMS / WMTS tile URL builders (no auth needed for public layers)
// ────────────────────────────────────────────────────────────────

/**
 * Returns an OGC WMS URL suitable for OpenLayers TileWMS source.
 * The {INSTANCE_ID} portion is your Sentinel Hub instance ID.
 */
export function buildWMSTileUrl(
  collectionId: CollectionId,
  visualization: VisualizationId,
  instanceId?: string
): string {
  const id =
    instanceId ?? process.env.NEXT_PUBLIC_SH_INSTANCE_ID ?? "YOUR_INSTANCE_ID";
  return `${WMS_BASE}/${id}`;
}

/**
 * Parameters for OpenLayers TileWMS source.
 */
export function getWMSParams(
  collectionId: CollectionId,
  visualization: VisualizationId,
  dateFrom: string,
  dateTo: string
): Record<string, string> {
  const layerMap: Record<string, string> = {
    "true-color": "TRUE-COLOR",
    "false-color": "FALSE-COLOR",
    ndvi: "NDVI",
    ndwi: "NDWI",
    swir: "SWIR",
    "sar-vh": "SAR-VH",
    custom: "TRUE-COLOR",
  };

  return {
    SERVICE: "WMS",
    REQUEST: "GetMap",
    VERSION: "1.3.0",
    LAYERS: layerMap[visualization] ?? "TRUE-COLOR",
    FORMAT: "image/png",
    TRANSPARENT: "true",
    TIME: `${dateFrom}/${dateTo}`,
    MAXCC: "100",
  };
}

// ────────────────────────────────────────────────────────────────
//  STAC Catalog Search
// ────────────────────────────────────────────────────────────────

export interface STACSearchParams {
  collections: CollectionId[];
  bbox: BBox;
  dateFrom: string;
  dateTo: string;
  maxCloudCover?: number;
  limit?: number;
  page?: number;
}

export interface STACResponse {
  type: "FeatureCollection";
  features: STACItem[];
  context?: {
    returned: number;
    matched: number;
    limit: number;
  };
  links?: Array<{ rel: string; href: string }>;
}

interface STACItem {
  id: string;
  type: "Feature";
  geometry: unknown;
  bbox: [number, number, number, number];
  properties: {
    datetime: string;
    "eo:cloud_cover"?: number;
    platform?: string;
    [key: string]: unknown;
  };
  assets: Record<string, { href: string; type?: string; title?: string }>;
  links?: Array<{ rel: string; href: string }>;
}

function stacItemToScene(item: STACItem, collectionId: CollectionId): Scene {
  const [west, south, east, north] = item.bbox;
  return {
    id: item.id,
    collectionId,
    date: item.properties.datetime,
    cloudCoverage: item.properties["eo:cloud_cover"] ?? 0,
    thumbnailUrl:
      item.assets?.thumbnail?.href ??
      item.assets?.QUICKLOOK?.href ??
      undefined,
    bbox: { west, south, east, north },
    productId: item.id,
    properties: item.properties as Record<string, unknown>,
  };
}

export async function searchScenes(
  params: STACSearchParams
): Promise<{ scenes: Scene[]; total: number }> {
  const { collections, bbox, dateFrom, dateTo, maxCloudCover, limit = 20 } =
    params;

  // Build STAC API search body
  const body: Record<string, unknown> = {
    bbox: [bbox.west, bbox.south, bbox.east, bbox.north],
    datetime: `${dateFrom}T00:00:00Z/${dateTo}T23:59:59Z`,
    collections: collections.map((c) => STAC_COLLECTION_MAP[c]),
    limit,
    sortby: [{ field: "properties.datetime", direction: "desc" }],
  };

  if (maxCloudCover !== undefined && maxCloudCover < 100) {
    body.filter = {
      op: "lte",
      args: [{ property: "eo:cloud_cover" }, maxCloudCover],
    };
    body["filter-lang"] = "cql2-json";
  }

  const res = await fetch(`${CATALOG_API}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`STAC search failed: ${res.status}`);
  }

  const data: STACResponse = await res.json();

  const scenes = data.features.map((item) =>
    stacItemToScene(item, collections[0])
  );

  return {
    scenes,
    total: data.context?.matched ?? scenes.length,
  };
}

// ────────────────────────────────────────────────────────────────
//  Process API — rendered image (requires auth)
// ────────────────────────────────────────────────────────────────

export interface ProcessRequest {
  collectionId: CollectionId;
  evalscript: string;
  bbox: BBox;
  dateFrom: string;
  dateTo: string;
  width?: number;
  height?: number;
  format?: "image/png" | "image/jpeg" | "image/tiff";
}

/**
 * Calls the Sentinel Hub Process API to render a satellite image.
 * Requires a valid OAuth2 token — obtainable via fetchPasswordToken()
 * or the /api/auth/token server route.
 */
export async function processImage(
  params: ProcessRequest
): Promise<Blob> {
  const token = getCachedToken();
  if (!token) {
    throw new Error(
      "Not authenticated. Please log in to use the Process API."
    );
  }

  const {
    collectionId,
    evalscript,
    bbox,
    dateFrom,
    dateTo,
    width = 512,
    height = 512,
    format = "image/png",
  } = params;

  const body = {
    input: {
      bounds: {
        bbox: [bbox.west, bbox.south, bbox.east, bbox.north],
        properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
      },
      data: [
        {
          type: SH_COLLECTION_MAP[collectionId],
          dataFilter: {
            timeRange: {
              from: `${dateFrom}T00:00:00Z`,
              to: `${dateTo}T23:59:59Z`,
            },
          },
        },
      ],
    },
    output: {
      width,
      height,
      responses: [{ identifier: "default", format: { type: format } }],
    },
    evalscript,
  };

  const res = await fetch(PROCESS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: format,
      ...authHeader(token),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Process API error: ${res.status} — ${msg}`);
  }

  return res.blob();
}

/**
 * Returns a data URL from a Process API call (for display in <img>).
 */
export async function processImageAsDataUrl(
  params: ProcessRequest
): Promise<string> {
  const blob = await processImage(params);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ── Download helper ────────────────────────────────────────────
export async function downloadScene(
  params: ProcessRequest,
  filename = "geoview_export.png"
): Promise<void> {
  const blob = await processImage({ ...params, format: "image/png" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Quick stats for a scene ───────────────────────────────────
export async function getCollectionInfo(
  collectionId: CollectionId
): Promise<unknown> {
  const stacId = STAC_COLLECTION_MAP[collectionId];
  const res = await fetch(`${CATALOG_API}/collections/${stacId}`);
  if (!res.ok) throw new Error(`Collection info failed: ${res.status}`);
  return res.json();
}
