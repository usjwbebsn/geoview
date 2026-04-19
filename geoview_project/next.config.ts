import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Needed for OpenLayers SSR compatibility
  transpilePackages: ["ol"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.dataspace.copernicus.eu",
      },
      {
        protocol: "https",
        hostname: "**.sentinel-hub.com",
      },
      {
        protocol: "https",
        hostname: "tile.openstreetmap.org",
      },
    ],
  },

  // Allow CORS for Copernicus APIs in dev
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,DELETE,OPTIONS",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
