import { NextResponse } from "next/server";

/**
 * Generates the Buffer OAuth authorization URL.
 */
export async function GET() {
  const clientId = process.env.BUFFER_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://social-ai-manager.vercel.app";

  if (!clientId) {
    return NextResponse.json({ error: "BUFFER_CLIENT_ID not configured" }, { status: 400 });
  }

  const redirectUri = `${appUrl}/api/integrations/buffer/callback`;

  // Buffer OAuth authorization endpoint (NOT api.bufferapp.com)
  const authUrl =
    `https://bufferapp.com/oauth2/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code`;

  return NextResponse.json({ url: authUrl });
}
