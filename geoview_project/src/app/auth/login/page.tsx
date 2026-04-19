"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, Eye, EyeOff, Satellite, AlertCircle } from "lucide-react";
import { useAppStore } from "@/lib/store/appStore";
import { fetchPasswordToken, saveToken } from "@/lib/api/copernicus-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser } = useAppStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = await fetchPasswordToken(email, password);
      saveToken(token);
      setToken(token);
      setUser({ id: email, email, name: email.split("@")[0] });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface grid-bg flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-96 w-96 rounded-full bg-accent-cyan/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-cyan/30 bg-accent-cyan/10">
            <Globe className="h-[18px] w-[18px] text-accent-cyan" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">GeoView</p>
            <p className="text-[11px] text-text-muted">Earth Observation Browser</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-panel-border bg-panel/90 backdrop-blur p-6 shadow-panel">
          <div className="mb-6">
            <h1 className="text-base font-semibold text-text-primary mb-1">Sign in</h1>
            <p className="text-xs text-text-muted">
              Use your{" "}
              <a
                href="https://identity.dataspace.copernicus.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-cyan/80 hover:text-accent-cyan underline underline-offset-2 transition-colors"
              >
                Copernicus Data Space
              </a>{" "}
              credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-accent-red/20 bg-accent-red/5 p-3">
                <AlertCircle className="h-3.5 w-3.5 text-accent-red mt-0.5 shrink-0" />
                <p className="text-xs text-accent-red/80">{error}</p>
              </div>
            )}

            <Button variant="default" size="lg" type="submit" disabled={loading} className="w-full mt-1">
              {loading
                ? <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-surface/40 border-t-surface animate-spin" />
                    Signing in…
                  </span>
                : "Sign in"
              }
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-panel-border text-center">
            <p className="text-xs text-text-muted">
              No account?{" "}
              <Link href="/auth/register" className="text-accent-cyan/80 hover:text-accent-cyan transition-colors">
                Register free
              </Link>
            </p>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-4 flex items-start gap-2 rounded-md border border-panel-border bg-panel/50 p-3">
          <Satellite className="h-3.5 w-3.5 text-text-muted mt-0.5 shrink-0" />
          <p className="text-[11px] text-text-muted leading-relaxed">
            Authentication uses the Copernicus CDSE OAuth2 password grant. Your credentials are never stored
            — only the short-lived access token is kept in memory.
          </p>
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
