/**
 * Copernicus Data Space Ecosystem — OAuth2 Authentication
 *
 * HOW TO GET CREDENTIALS
 * ──────────────────────
 * 1. Register at https://identity.dataspace.copernicus.eu
 * 2. Go to User Settings → OAuth Clients → Create Client
 * 3. Set Grant Type: "Client Credentials" for server-side
 *    OR "Authorization Code + PKCE" for browser-based OAuth
 * 4. Copy the Client ID and (if applicable) Client Secret
 * 5. Set NEXT_PUBLIC_CDSE_CLIENT_ID and CDSE_CLIENT_SECRET in .env.local
 *
 * IMPORTANT: Client Secret must NEVER be exposed client-side.
 * Use the /api/auth/token Next.js route to proxy token requests.
 *
 * Documentation: https://documentation.dataspace.copernicus.eu/APIs/OData.html
 */

import type { AuthToken } from "@/types";

const TOKEN_URL =
  process.env.NEXT_PUBLIC_CDSE_AUTH_URL ??
  "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";

const STORAGE_KEY = "geoview_auth_token";

// ── Token cache ───────────────────────────────────────────────
let tokenCache: AuthToken | null = null;

export function getCachedToken(): AuthToken | null {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache;
  }
  // Try localStorage fallback
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const token = JSON.parse(raw) as AuthToken;
      if (token.expiresAt > Date.now() + 30_000) {
        tokenCache = token;
        return token;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveToken(token: AuthToken): void {
  tokenCache = token;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(token));
  } catch {
    /* quota exceeded */
  }
}

export function clearToken(): void {
  tokenCache = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ── Client Credentials (server-side proxy recommended) ────────
/**
 * Fetches a token via Client Credentials grant.
 * Call this from a Next.js API route (/api/auth/token) to keep the
 * client secret server-side only.
 */
export async function fetchClientCredentialsToken(
  clientId: string,
  clientSecret: string
): Promise<AuthToken> {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token request failed: ${res.status} ${err}`);
  }

  const data = await res.json();

  const token: AuthToken = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    tokenType: data.token_type ?? "Bearer",
  };

  return token;
}

// ── Password grant (for testing only — not recommended) ────────
export async function fetchPasswordToken(
  username: string,
  password: string,
  clientId = "cdse-public"
): Promise<AuthToken> {
  const params = new URLSearchParams({
    grant_type: "password",
    username,
    password,
    client_id: clientId,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(
      err?.error_description ?? `Auth failed: ${res.status}`
    );
  }

  const data = await res.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    tokenType: data.token_type ?? "Bearer",
  };
}

// ── Refresh token ─────────────────────────────────────────────
export async function refreshAccessToken(
  refreshToken: string,
  clientId = "cdse-public"
): Promise<AuthToken> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);

  const data = await res.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
    tokenType: data.token_type ?? "Bearer",
  };
}

// ── Auth header helper ─────────────────────────────────────────
export function authHeader(token: AuthToken): Record<string, string> {
  return { Authorization: `${token.tokenType} ${token.accessToken}` };
}
