import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/memory/store";
import { getInstagramProfiles } from "@/lib/integrations/buffer";

/**
 * Buffer OAuth 2.0 Callback
 * Buffer redirects here with ?code=... after user authorizes.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://social-ai-manager.vercel.app";

  if (error || !code) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings?buffer_error=${encodeURIComponent(error ?? "cancelled")}`
    );
  }

  const clientId = process.env.BUFFER_CLIENT_ID!;
  const redirectUri = `${appUrl}/api/integrations/buffer/callback`;

  try {
    // Exchange code → access token (PKCE public client — no secret needed)
    const tokenRes = await fetch("https://api.bufferapp.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        code,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description ?? tokenData.error ?? "Token exchange failed");
    }

    const token: string = tokenData.access_token;

    // Fetch connected Instagram profiles
    const profiles = await getInstagramProfiles(token);

    // Persist token + first Instagram profile
    await memory.saveSettings({
      bufferAccessToken: token,
      bufferProfileId: profiles[0]?.id ?? "",
    });

    const username = profiles[0]?.service_username ?? "";

    return NextResponse.redirect(
      `${appUrl}/dashboard/settings?buffer_connected=1&buffer_username=${encodeURIComponent(username)}&buffer_profiles=${profiles.length}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OAuth error";
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings?buffer_error=${encodeURIComponent(msg)}`
    );
  }
}
