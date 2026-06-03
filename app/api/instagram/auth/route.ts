import { NextResponse } from "next/server";

/**
 * Generates the Instagram OAuth authorization URL.
 * Required env vars:
 *   INSTAGRAM_APP_ID     – Meta App ID
 *   INSTAGRAM_APP_SECRET – Meta App Secret
 *   NEXT_PUBLIC_APP_URL  – e.g. http://localhost:3000
 */
export async function GET() {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!appId) {
    return NextResponse.json(
      { error: "INSTAGRAM_APP_ID is not configured" },
      { status: 400 }
    );
  }

  const redirectUri = `${appUrl}/api/instagram/callback`;

  const scopes = [
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_insights",
    "pages_read_engagement",
  ].join(",");

  const oauthUrl =
    `https://api.instagram.com/oauth/authorize` +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scopes}` +
    `&response_type=code`;

  return NextResponse.json({ url: oauthUrl });
}
