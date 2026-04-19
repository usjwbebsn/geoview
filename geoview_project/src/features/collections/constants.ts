import type { Collection } from "@/types";

export const COLLECTIONS: Collection[] = [
  {
    id: "sentinel-2-l2a",
    name: "Sentinel-2 L2A",
    shortName: "S2-L2A",
    satellite: "Sentinel-2",
    resolution: "10–60 m",
    revisitTime: "5 days",
    description:
      "Atmospherically corrected surface reflectance. 13 multispectral bands. Best for vegetation, land use, and water analysis.",
    bands: [
      { id: "B01", name: "Coastal Aerosol", wavelength: "443 nm", description: "" },
      { id: "B02", name: "Blue", wavelength: "490 nm", description: "" },
      { id: "B03", name: "Green", wavelength: "560 nm", description: "" },
      { id: "B04", name: "Red", wavelength: "665 nm", description: "" },
      { id: "B05", name: "Red Edge 1", wavelength: "705 nm", description: "" },
      { id: "B06", name: "Red Edge 2", wavelength: "740 nm", description: "" },
      { id: "B07", name: "Red Edge 3", wavelength: "783 nm", description: "" },
      { id: "B08", name: "NIR", wavelength: "842 nm", description: "" },
      { id: "B8A", name: "NIR Narrow", wavelength: "865 nm", description: "" },
      { id: "B09", name: "Water Vapour", wavelength: "945 nm", description: "" },
      { id: "B11", name: "SWIR 1", wavelength: "1610 nm", description: "" },
      { id: "B12", name: "SWIR 2", wavelength: "2190 nm", description: "" },
      { id: "SCL", name: "Scene Classification", wavelength: undefined, description: "" },
    ],
    defaultVisualization: "true-color",
    supportsCloudFilter: true,
    color: "#38bdf8",
  },
  {
    id: "sentinel-2-l1c",
    name: "Sentinel-2 L1C",
    shortName: "S2-L1C",
    satellite: "Sentinel-2",
    resolution: "10–60 m",
    revisitTime: "5 days",
    description:
      "Top-of-atmosphere reflectance. Same 13 bands as L2A, without atmospheric correction.",
    bands: [],
    defaultVisualization: "true-color",
    supportsCloudFilter: true,
    color: "#60a5fa",
  },
  {
    id: "sentinel-1-grd",
    name: "Sentinel-1 GRD",
    shortName: "S1-GRD",
    satellite: "Sentinel-1",
    resolution: "10 m",
    revisitTime: "6–12 days",
    description:
      "SAR (Synthetic Aperture Radar) — sees through clouds. Ideal for flood mapping, ship detection, and deforestation monitoring.",
    bands: [
      { id: "VV", name: "VV polarisation", description: "Co-polarisation" },
      { id: "VH", name: "VH polarisation", description: "Cross-polarisation" },
    ],
    defaultVisualization: "sar-vh",
    supportsCloudFilter: false,
    color: "#f59e0b",
  },
  {
    id: "sentinel-3-olci",
    name: "Sentinel-3 OLCI",
    shortName: "S3-OLCI",
    satellite: "Sentinel-3",
    resolution: "300 m",
    revisitTime: "2 days",
    description:
      "Ocean and Land Color Instrument. 21 bands. Ideal for large-scale ocean color, vegetation, and atmospheric monitoring.",
    bands: [],
    defaultVisualization: "true-color",
    supportsCloudFilter: true,
    color: "#a78bfa",
  },
  {
    id: "dem",
    name: "Copernicus DEM",
    shortName: "COP-DEM",
    satellite: "TanDEM-X",
    resolution: "30–90 m",
    revisitTime: "Static",
    description:
      "Digital Elevation Model derived from TanDEM-X radar mission. Provides global terrain height data.",
    bands: [
      { id: "DEM", name: "Elevation", wavelength: undefined, description: "Height in meters" },
    ],
    defaultVisualization: "true-color",
    supportsCloudFilter: false,
    color: "#22d3a0",
  },
  {
    id: "landsat-8-l2",
    name: "Landsat-8 L2",
    shortName: "L8-L2",
    satellite: "Landsat-8",
    resolution: "30 m",
    revisitTime: "16 days",
    description:
      "USGS/NASA Landsat-8 OLI/TIRS Level-2. Atmospherically corrected. Historical archive back to 2013.",
    bands: [],
    defaultVisualization: "true-color",
    supportsCloudFilter: true,
    color: "#fb923c",
  },
];

export const COLLECTION_MAP = Object.fromEntries(
  COLLECTIONS.map((c) => [c.id, c])
) as Record<string, Collection>;
