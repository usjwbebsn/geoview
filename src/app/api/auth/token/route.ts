/**
 * POST /api/auth/token
 * ─────────────────────────────────────────────────────────────
 * Server-side proxy for the Copernicus CDSE OAuth2 token endpoint.
 * This keeps the CDSE_CLIENT_SECRET out of the browser entirely.
 *
 * Request body: { grant_type: "password", username, password }
 *            OR { grant_type: "refresh_token", refresh_token }
 *            OR { grant_type: "client_credentials" }
 */
import { NextRequest, NextResponse } from "next/server";

const TOKEN_URL =
  process.env.NEXT_PUBLIC_CDSE_AUTH_URL ??
  "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>;
    const { grant_type, username, password, refresh_token } = body;

    const clientId = process.env.NEXT_PUBLIC_CDSE_CLIENT_ID ?? "cdse-public";
    const clientSecret = process.env.CDSE_CLIENT_SECRET;

    const params = new URLSearchParams({ grant_type, client_id: clientId });

    if (clientSecret) params.set("client_secret", clientSecret);

    if (grant_type === "password") {
      if (!username || !password) {
        return NextResponse.json({ error: "username and password required" }, { status: 400 });
      }
      params.set("username", username);
      params.set("password", password);
    } else if (grant_type === "refresh_token") {
      if (!refresh_token) {
        return NextResponse.json({ error: "refresh_token required" }, { status: 400 });
      }
      params.set("refresh_token", refresh_token);
    }

    const upstream = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await upstream.json() as Record<string, unknown>;

    if (!upstream.ok) {
      return NextResponse.json(
        { error: (data as { error_description?: string }).error_description ?? "Auth failed" },
        { status: upstream.status }
      );
    }

    // Return only what the client needs — never expose client_secret
    return NextResponse.json({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_in:    data.expires_in,
      token_type:    data.token_type,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
