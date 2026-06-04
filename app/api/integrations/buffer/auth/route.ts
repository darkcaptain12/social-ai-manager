import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";

/**
 * Buffer OAuth 2.0 with PKCE (required for public clients — no client secret).
 * 1. Generate code_verifier + code_challenge
 * 2. Store verifier in a cookie
 * 3. Redirect user to Buffer authorization page
 */

function base64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function GET() {
  const clientId = process.env.BUFFER_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://social-ai-manager.vercel.app";

  if (!clientId) {
    return NextResponse.json({ error: "BUFFER_CLIENT_ID not configured" }, { status: 400 });
  }

  // PKCE: code_verifier (random 43-128 char string)
  const codeVerifier = base64url(randomBytes(32));

  // code_challenge = BASE64URL(SHA256(ASCII(code_verifier)))
  const codeChallenge = base64url(
    createHash("sha256").update(codeVerifier).digest()
  );

  // Store verifier in cookie for callback
  const cookieStore = await cookies();
  cookieStore.set("buffer_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 min
    path: "/",
  });

  const redirectUri = `${appUrl}/api/integrations/buffer/callback`;

  const authUrl =
    `https://buffer.com/oauth2/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&code_challenge=${encodeURIComponent(codeChallenge)}` +
    `&code_challenge_method=S256`;

  return NextResponse.json({ url: authUrl });
}
