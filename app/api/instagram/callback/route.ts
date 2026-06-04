import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/memory/store";

/**
 * Instagram OAuth callback.
 * Meta redirects here with ?code=... after the user authorizes.
 * Flow: code → short-lived token → long-lived token (60d) → save + redirect.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://social-ai-manager.vercel.app";

  if (error || !code) {
    const reason = searchParams.get("error_reason") ?? error ?? "unknown";
    return NextResponse.redirect(`${appUrl}/dashboard/settings?ig_error=${encodeURIComponent(reason)}`);
  }

  const appId = process.env.INSTAGRAM_APP_ID!;
  const appSecret = process.env.INSTAGRAM_APP_SECRET!;
  const redirectUri = `${appUrl}/api/instagram/callback`;

  try {
    // 1 — Exchange code → short-lived token
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: appId, client_secret: appSecret, grant_type: "authorization_code", redirect_uri: redirectUri, code }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(tokenData.error_message ?? "Token exchange failed");

    // 2 — Upgrade to long-lived token (60 days)
    const longRes = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${tokenData.access_token}`);
    const longData = await longRes.json();
    const finalToken: string = longData.access_token ?? tokenData.access_token;

    // 3 — Fetch profile
    const profileRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${finalToken}`);
    const profile = await profileRes.json();

    // 4 — Persist
    await memory.saveSettings({ instagramAccessToken: finalToken, instagramAccountId: profile.id ?? tokenData.user_id?.toString() });

    return NextResponse.redirect(`${appUrl}/dashboard/settings?ig_connected=1&ig_username=${encodeURIComponent(profile.username ?? "")}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OAuth error";
    return NextResponse.redirect(`${appUrl}/dashboard/settings?ig_error=${encodeURIComponent(msg)}`);
  }
}
