import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "GeoView — Earth Observation Browser",
  description:
    "Explore Copernicus satellite imagery. Search Sentinel-2, Sentinel-1, and more via the Copernicus Data Space Ecosystem.",
  keywords: [
    "satellite imagery",
    "Copernicus",
    "Sentinel-2",
    "earth observation",
    "remote sensing",
    "NDVI",
    "GIS",
  ],
  authors: [{ name: "GeoView" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090b0e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#0f1218",
                border: "1px solid #1c2232",
                color: "#dce4f0",
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
