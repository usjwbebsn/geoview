# GeoView — Earth Observation Browser

A modern, minimal satellite imagery browser built on the [Copernicus Data Space Ecosystem](https://dataspace.copernicus.eu), similar to the Copernicus Browser or EO Browser by Sentinel Hub.

---

## Features

| Feature | Detail |
|---|---|
| **Interactive Map** | OpenLayers 10 with dark CartoDB base tiles |
| **AOI Drawing** | Rectangle (bbox) and Polygon drawing tools |
| **Collections** | Sentinel-2 L2A/L1C, Sentinel-1 GRD, Sentinel-3 OLCI, Copernicus DEM, Landsat-8 |
| **Image Search** | STAC Catalog API — results with thumbnails, dates, cloud coverage |
| **Visualization** | True Color, False Color, NDVI, NDWI, SWIR, SAR, Custom Evalscript |
| **Timelapse** | Animate scenes chronologically with frame scrubber |
| **Download** | Export rendered imagery via the Sentinel Hub Process API |
| **Authentication** | Copernicus CDSE OAuth2 password grant + server-side token proxy |
| **Geocoding** | Nominatim (OpenStreetMap) — no API key needed |

---

## Quick Start

### 1 · Install dependencies

```bash
npm install
# or
pnpm install
```

### 2 · Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` — the minimum required is your **Sentinel Hub Instance ID** for the WMS layer. The map and STAC search work without any credentials.

### 3 · Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Getting Credentials

### Sentinel Hub Instance ID (for satellite imagery overlay)

1. Register at [Sentinel Hub Dashboard](https://shapps.dataspace.copernicus.eu/dashboard/)
2. Go to **Configuration Utility** → **New Configuration**
3. Add layers (True Color, NDVI, etc.)
4. Copy the **Instance ID** (UUID format)
5. Set `NEXT_PUBLIC_SH_INSTANCE_ID=<uuid>` in `.env.local`

> **Note:** Sentinel Hub offers a 30-day free trial. After that, a subscription is needed for the WMS/Process API.

### Copernicus CDSE Account (for image download via Process API)

1. Register at [dataspace.copernicus.eu](https://dataspace.copernicus.eu) — **free**
2. Use your email + password on the GeoView login page
3. Tokens are obtained via the `/api/auth/token` server-side proxy (your password never touches the browser directly)

### OAuth Client (optional, for client_credentials grant)

1. Go to **User Settings → OAuth Clients → Create Client** in CDSE
2. Set grant type to `Client Credentials`
3. Copy Client ID + Secret → `.env.local`

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    ← Main map page (dynamic import, ssr:false)
│   ├── layout.tsx                  ← Root layout + providers
│   ├── globals.css                 ← DM Sans/Mono, CSS variables, OL overrides
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── settings/page.tsx
│   └── api/auth/token/route.ts     ← OAuth2 proxy (keeps secret server-side)
│
├── components/
│   ├── providers/Providers.tsx     ← TanStack Query provider
│   └── ui/                        ← shadcn-compatible UI primitives
│
├── features/
│   ├── layout/MapLayout.tsx        ← Root client layout (panels + map)
│   ├── map/components/
│   │   ├── MapView.tsx             ← OpenLayers map initialization
│   │   └── DrawingTools.tsx        ← AOI draw toolbar
│   ├── panels/
│   │   ├── LeftPanel.tsx           ← Collections, Filters, Drawing tabs
│   │   └── RightPanel.tsx          ← Results, Visualization tabs
│   ├── search/LocationSearch.tsx   ← Nominatim geocoding search
│   ├── results/ImageList.tsx       ← STAC scene list
│   ├── visualization/
│   │   ├── VisualizationPanel.tsx
│   │   ├── EvalscriptEditor.tsx
│   │   └── constants/evalscripts.ts
│   ├── timelapse/TimelapsePlayer.tsx
│   └── collections/constants.ts
│
├── lib/
│   ├── store/appStore.ts           ← Zustand store (auth/map/filters/viz/ui)
│   ├── api/
│   │   ├── copernicus-auth.ts      ← OAuth2 token management
│   │   ├── sentinel-hub.ts         ← STAC search + WMS + Process API
│   │   └── geocoding.ts            ← Nominatim
│   └── utils.ts                    ← cn(), formatDate(), debounce(), etc.
│
└── types/index.ts                  ← Global TypeScript types
```

---

## Architecture Notes

### Map (OpenLayers)
- Loaded via `next/dynamic` with `ssr: false` — OL is browser-only
- Base layer: CartoDB Dark Matter (free, no key)
- Satellite WMS: Sentinel Hub TileWMS (requires Instance ID)
- AOI drawing: OL `Draw` interaction (bbox = `createBox()`, polygon = `Polygon`)
- Map ↔ Zustand: bidirectional sync via `view.on('change')` and `view.animate()`

### Authentication
- Login page calls `/api/auth/token` (Next.js API route, server-side)
- The route proxies to CDSE OAuth2, keeping `CDSE_CLIENT_SECRET` server-only
- Token is stored in Zustand + localStorage (no cookies)
- Token refresh handled by `copernicus-auth.ts`

### Data Flow
```
User sets AOI + filters
  → clicks "Search Images"
  → TanStack Query calls STAC /search
  → scenes stored in Zustand
  → ImageList renders results
  → click scene → map flies to bbox
  → WMS layer updates with date range
```

### Evalscripts
Custom JavaScript evalscripts run server-side in Sentinel Hub (not in the browser). GeoView sends them as strings to the Process API or WMS endpoint.

---

## Available Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run type-check   # TypeScript check
npm run lint         # ESLint
```

---

## Extending

### Add a new collection
Edit `src/features/collections/constants.ts` — add a `Collection` object.

### Add a new visualization
Edit `src/features/visualization/constants/evalscripts.ts` — add an evalscript string and a `Visualization` object. The WMS layer map in `sentinel-hub.ts` may also need updating.

### Add a new base layer
In `MapView.tsx`, swap the `XYZ` source URL. OpenStreetMap, Esri World Imagery, and Mapbox are common alternatives.

---

## License

MIT — feel free to fork and adapt.

External services (Copernicus, Sentinel Hub, Nominatim) are subject to their own terms of use.
