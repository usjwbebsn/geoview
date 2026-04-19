import type { Visualization } from "@/types";

// ── Evalscripts ────────────────────────────────────────────────
// Reference: https://docs.sentinel-hub.com/api/latest/evalscript/

export const EVALSCRIPTS: Record<string, string> = {
  "true-color": `//VERSION=3
function setup() {
  return {
    input: ["B02","B03","B04","dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  return [3.5*s.B04, 3.5*s.B03, 3.5*s.B02, s.dataMask];
}`,

  "false-color": `//VERSION=3
function setup() {
  return {
    input: ["B03","B04","B08","dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  return [3.5*s.B08, 3.5*s.B04, 3.5*s.B03, s.dataMask];
}`,

  ndvi: `//VERSION=3
function setup() {
  return {
    input: ["B04","B08","dataMask"],
    output: { bands: 4 }
  };
}
const colorRamp = [
  [-0.5, 0.6, 0.0, 0.1],
  [ 0.0, 0.8, 0.3, 0.1],
  [ 0.2, 0.9, 0.8, 0.1],
  [ 0.4, 0.1, 0.6, 0.1],
  [ 0.7, 0.0, 0.4, 0.0],
  [ 1.0, 0.0, 0.25,0.0]
];
function lerp(a, b, t) { return a + (b - a) * t; }
function colorize(val) {
  for (let i = 1; i < colorRamp.length; i++) {
    if (val <= colorRamp[i][0]) {
      const t = (val - colorRamp[i-1][0]) / (colorRamp[i][0] - colorRamp[i-1][0]);
      return [lerp(colorRamp[i-1][1],colorRamp[i][1],t),
              lerp(colorRamp[i-1][2],colorRamp[i][2],t),
              lerp(colorRamp[i-1][3],colorRamp[i][3],t)];
    }
  }
  return colorRamp[colorRamp.length - 1].slice(1);
}
function evaluatePixel(s) {
  const ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);
  const c = colorize(ndvi);
  return [c[0], c[1], c[2], s.dataMask];
}`,

  ndwi: `//VERSION=3
function setup() {
  return {
    input: ["B03","B08","dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  const ndwi = (s.B03 - s.B08) / (s.B03 + s.B08);
  if (ndwi > 0.3) return [0.0, 0.4, 0.9, s.dataMask];
  if (ndwi > 0.0) return [0.3, 0.6, 0.8, s.dataMask];
  if (ndwi > -0.3) return [0.7, 0.7, 0.5, s.dataMask];
  return [0.4, 0.3, 0.1, s.dataMask];
}`,

  swir: `//VERSION=3
function setup() {
  return {
    input: ["B04","B08","B11","dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  return [3.5*s.B11, 3.5*s.B08, 3.5*s.B04, s.dataMask];
}`,

  "sar-vh": `//VERSION=3
function setup() {
  return {
    input: ["VV","VH","dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  const VV = Math.sqrt(s.VV);
  const VH = Math.sqrt(s.VH);
  return [VV*2, VH*8, VV*0.5, s.dataMask];
}`,
};

// ── Visualization metadata ─────────────────────────────────────

export const VISUALIZATIONS: Visualization[] = [
  {
    id: "true-color",
    name: "True Color",
    description: "Natural RGB — bands B04, B03, B02",
    evalscript: EVALSCRIPTS["true-color"],
    applicableCollections: ["sentinel-2-l2a", "sentinel-2-l1c", "sentinel-3-olci", "landsat-8-l2"],
  },
  {
    id: "false-color",
    name: "False Color (NIR)",
    description: "Near-infrared composite — highlights vegetation",
    evalscript: EVALSCRIPTS["false-color"],
    applicableCollections: ["sentinel-2-l2a", "sentinel-2-l1c", "landsat-8-l2"],
  },
  {
    id: "ndvi",
    name: "NDVI",
    description: "Normalized Difference Vegetation Index",
    evalscript: EVALSCRIPTS["ndvi"],
    applicableCollections: ["sentinel-2-l2a", "sentinel-2-l1c", "landsat-8-l2"],
  },
  {
    id: "ndwi",
    name: "NDWI",
    description: "Normalized Difference Water Index",
    evalscript: EVALSCRIPTS["ndwi"],
    applicableCollections: ["sentinel-2-l2a", "sentinel-2-l1c", "landsat-8-l2"],
  },
  {
    id: "swir",
    name: "SWIR",
    description: "Short-Wave Infrared — burn scars, soil moisture",
    evalscript: EVALSCRIPTS["swir"],
    applicableCollections: ["sentinel-2-l2a", "sentinel-2-l1c", "landsat-8-l2"],
  },
  {
    id: "sar-vh",
    name: "SAR RGB",
    description: "SAR VV/VH composite — works through clouds",
    evalscript: EVALSCRIPTS["sar-vh"],
    applicableCollections: ["sentinel-1-grd"],
  },
  {
    id: "custom",
    name: "Custom Evalscript",
    description: "Write your own JavaScript evalscript",
    evalscript: EVALSCRIPTS["true-color"],
    applicableCollections: [
      "sentinel-2-l2a",
      "sentinel-2-l1c",
      "sentinel-1-grd",
      "sentinel-3-olci",
      "dem",
      "landsat-8-l2",
      "modis",
    ],
  },
];

export const VISUALIZATION_MAP = Object.fromEntries(
  VISUALIZATIONS.map((v) => [v.id, v])
) as Record<string, Visualization>;
