"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Key, Map, Satellite, Server, Check, Eye, EyeOff } from "lucide-react";
import { useAppStore } from "@/lib/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EnvVar { key: string; label: string; placeholder: string; secret?: boolean; hint?: string }

const ENV_VARS: EnvVar[] = [
  {
    key: "NEXT_PUBLIC_SH_INSTANCE_ID",
    label: "Sentinel Hub Instance ID",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    hint: "Create at Sentinel Hub Dashboard → Configuration Utility → New Configuration.",
  },
  {
    key: "NEXT_PUBLIC_CDSE_CLIENT_ID",
    label: "OAuth Client ID",
    placeholder: "your-client-id",
    hint: "CDSE → User Settings → OAuth Clients → Create.",
  },
  {
    key: "CDSE_CLIENT_SECRET",
    label: "OAuth Client Secret",
    placeholder: "••••••••••••••••",
    secret: true,
    hint: "Keep this server-side only. Use the /api/auth/token proxy route.",
  },
];

type Section = "credentials" | "map" | "about";

export default function SettingsPage() {
  const { isAuthenticated, user } = useAppStore();
  const [activeSection, setActiveSection] = useState<Section>("credentials");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections: { id: Section; icon: React.ElementType; label: string }[] = [
    { id: "credentials", icon: Key,       label: "API Credentials" },
    { id: "map",         icon: Map,       label: "Map Defaults" },
    { id: "about",       icon: Globe,     label: "About" },
  ];

  return (
    <div className="min-h-screen bg-surface grid-bg text-text-primary font-sans">
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-accent-cyan/3 blur-3xl" />
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Sidebar nav */}
        <nav className="w-52 border-r border-panel-border bg-panel/80 flex flex-col p-3 gap-1 shrink-0">
          <div className="flex items-center gap-2 px-2 py-3 mb-2">
            <Globe className="h-4 w-4 text-accent-cyan" />
            <span className="text-sm font-semibold">GeoView</span>
          </div>
          <Separator className="mb-2" />
          {sections.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                "flex items-center gap-2.5 rounded px-2.5 py-2 text-xs transition-colors text-left",
                activeSection === id
                  ? "bg-panel-hover text-text-primary"
                  : "text-text-muted hover:text-text-secondary hover:bg-panel-hover"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </button>
          ))}

          <div className="flex-1" />
          <Link
            href="/"
            className="flex items-center gap-2 px-2.5 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Map
          </Link>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-8">
          {activeSection === "credentials" && (
            <CredentialsSection
              envVars={ENV_VARS}
              showSecrets={showSecrets}
              setShowSecrets={setShowSecrets}
              onSave={handleSave}
              saved={saved}
            />
          )}
          {activeSection === "map" && <MapDefaultsSection />}
          {activeSection === "about" && <AboutSection isAuthenticated={isAuthenticated} user={user} />}
        </main>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2.5 mb-2">
        <Icon className="h-4 w-4 text-accent-cyan" />
        <h1 className="text-base font-semibold">{title}</h1>
      </div>
      <p className="text-xs text-text-muted leading-relaxed">{description}</p>
      <Separator className="mt-4" />
    </div>
  );
}

function CredentialsSection({ envVars, showSecrets, setShowSecrets, onSave, saved }: {
  envVars: EnvVar[];
  showSecrets: Record<string, boolean>;
  setShowSecrets: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onSave: () => void;
  saved: boolean;
}) {
  return (
    <div className="max-w-lg">
      <SectionHeader
        icon={Key}
        title="API Credentials"
        description="Configure your Sentinel Hub and Copernicus Data Space credentials. Set these in your .env.local file — do not commit secrets to version control."
      />

      <div className="flex flex-col gap-6">
        {envVars.map(({ key, label, placeholder, secret, hint }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={key}>{label}</Label>
            <div className="relative">
              <Input
                id={key}
                type={secret && !showSecrets[key] ? "password" : "text"}
                placeholder={placeholder}
                className="font-mono text-xs pr-9"
                readOnly
                value=""
              />
              {secret && (
                <button
                  onClick={() => setShowSecrets(p => ({ ...p, [key]: !p[key] }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showSecrets[key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              )}
            </div>
            {hint && <p className="text-[11px] text-text-muted leading-relaxed">{hint}</p>}
            <div className="flex items-center gap-1.5 rounded bg-surface border border-panel-border px-2 py-1">
              <Server className="h-3 w-3 text-text-muted shrink-0" />
              <code className="text-[11px] font-mono text-text-muted">{key}=your_value</code>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Button variant="default" size="md" onClick={onSave} className="gap-2">
          {saved
            ? <><Check className="h-3.5 w-3.5" /> Saved!</>
            : "Save (add to .env.local)"
          }
        </Button>
        <p className="text-[11px] text-text-muted">Restart the dev server after editing .env.local</p>
      </div>
    </div>
  );
}

function MapDefaultsSection() {
  const { viewState } = useAppStore();
  return (
    <div className="max-w-lg">
      <SectionHeader
        icon={Map}
        title="Map Defaults"
        description="Configure the initial map view and base layer preferences."
      />
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Default Center Lon</Label>
            <Input value={viewState.center[0].toFixed(4)} readOnly className="font-mono text-xs" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Default Center Lat</Label>
            <Input value={viewState.center[1].toFixed(4)} readOnly className="font-mono text-xs" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Default Zoom</Label>
          <Input value={viewState.zoom.toFixed(1)} readOnly className="font-mono text-xs" />
        </div>
        <p className="text-[11px] text-text-muted rounded-md border border-panel-border bg-surface p-3 leading-relaxed">
          Current map state is auto-persisted to localStorage. Navigate the map and it will remember your position on next visit.
        </p>
      </div>
    </div>
  );
}

function AboutSection({ isAuthenticated, user }: { isAuthenticated: boolean; user: { email: string } | null }) {
  const links = [
    { label: "Copernicus Data Space Ecosystem", href: "https://dataspace.copernicus.eu" },
    { label: "Sentinel Hub Documentation",       href: "https://docs.sentinel-hub.com" },
    { label: "STAC Catalog API",                 href: "https://catalogue.dataspace.copernicus.eu/stac" },
    { label: "Evalscript Reference",             href: "https://docs.sentinel-hub.com/api/latest/evalscript/" },
    { label: "Nominatim Geocoding",              href: "https://nominatim.org" },
    { label: "OpenLayers",                       href: "https://openlayers.org" },
  ];

  return (
    <div className="max-w-lg">
      <SectionHeader
        icon={Globe}
        title="About GeoView"
        description="Open-source Earth observation browser built on the Copernicus Data Space Ecosystem."
      />

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-text-secondary">Status</p>
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", isAuthenticated ? "bg-accent-green" : "bg-text-muted")} />
            <span className="text-xs text-text-secondary">
              {isAuthenticated ? `Authenticated as ${user?.email}` : "Not authenticated"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-text-secondary mb-1">Tech Stack</p>
          {["Next.js 15 · App Router", "OpenLayers 10", "Zustand + TanStack Query", "Tailwind CSS · shadcn/ui"].map(t => (
            <div key={t} className="flex items-center gap-2 py-1 border-b border-panel-border last:border-0">
              <span className="text-xs text-text-muted">{t}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-text-secondary mb-1">External Resources</p>
          {links.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between py-1 text-xs text-text-muted hover:text-accent-cyan transition-colors border-b border-panel-border last:border-0"
            >
              {label}
              <span className="text-[11px]">↗</span>
            </a>
          ))}
        </div>

        <div className="rounded-md border border-accent-amber/20 bg-accent-amber/5 p-3">
          <p className="text-[11px] text-accent-amber/80 leading-relaxed">
            <strong className="text-accent-amber">Fair Use:</strong> Nominatim geocoding is rate-limited to 1 req/s. The STAC catalog is public. The WMS/Process API requires a valid Sentinel Hub subscription.
          </p>
        </div>
      </div>
    </div>
  );
}
