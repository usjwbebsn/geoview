import Link from "next/link";
import { Globe, ExternalLink } from "lucide-react";

/**
 * Register page — GeoView doesn't manage its own user accounts.
 * Registration is done at dataspace.copernicus.eu.
 */
export default function RegisterPage() {
  const steps = [
    {
      step: "01",
      title: "Visit Copernicus Data Space",
      description: "Go to the official registration portal.",
      href: "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/registrations?client_id=cdse-public&response_type=token&scope=openid&redirect_uri=https://dataspace.copernicus.eu/",
      cta: "Open registration ↗",
    },
    {
      step: "02",
      title: "Create your account",
      description: "Fill in your details. The service is free for all users.",
      href: null,
      cta: null,
    },
    {
      step: "03",
      title: "Verify your email",
      description: "Click the confirmation link sent to your inbox.",
      href: null,
      cta: null,
    },
    {
      step: "04",
      title: "Sign in to GeoView",
      description: "Use those same credentials to authenticate here.",
      href: "/auth/login",
      cta: "Go to login →",
    },
  ];

  return (
    <div className="min-h-screen bg-surface grid-bg flex items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-96 w-96 rounded-full bg-accent-green/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm z-10">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-green/30 bg-accent-green/10">
            <Globe className="h-[18px] w-[18px] text-accent-green" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">GeoView</p>
            <p className="text-[11px] text-text-muted">Earth Observation Browser</p>
          </div>
        </div>

        <div className="rounded-xl border border-panel-border bg-panel/90 backdrop-blur p-6 shadow-panel">
          <div className="mb-6">
            <h1 className="text-base font-semibold text-text-primary mb-1">Get Started</h1>
            <p className="text-xs text-text-muted leading-relaxed">
              GeoView uses your free Copernicus Data Space Ecosystem account. Follow these steps to register.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {steps.map(({ step, title, description, href, cta }) => (
              <div key={step} className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-panel-border bg-surface">
                  <span className="text-[10px] font-mono text-text-muted">{step}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary mb-0.5">{title}</p>
                  <p className="text-[11px] text-text-muted leading-relaxed">{description}</p>
                  {href && cta && (
                    <Link
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] text-accent-cyan/80 hover:text-accent-cyan transition-colors"
                    >
                      {cta}
                      {href.startsWith("http") && <ExternalLink className="h-2.5 w-2.5" />}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
            ← Back to map
          </Link>
        </div>
      </div>
    </div>
  );
}
