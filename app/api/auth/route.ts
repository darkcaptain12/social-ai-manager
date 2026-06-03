import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "social-ai-manager-secret-key-2024"
);

// Single user system — credentials from env
const USER_EMAIL = process.env.APP_EMAIL ?? "admin@socialai.local";
const USER_PASSWORD_HASH =
  process.env.APP_PASSWORD_HASH ??
  "$2b$10$fixedHashForDemoOnly.ChangeThisInProduction.xxxxxx";

export async function POST(req: NextRequest) {
  try {
    const { email, password, action } = await req.json();

    if (action === "login") {
      if (email !== USER_EMAIL) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      // Demo mode: accept "admin" password if no hash configured
      const isDemo = USER_PASSWORD_HASH.includes("fixedHashForDemoOnly");
      const valid = isDemo
        ? password === "admin"
        : await bcrypt.compare(password, USER_PASSWORD_HASH);

      if (!valid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const token = await new SignJWT({ email })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(SECRET);

      const response = NextResponse.json({ success: true });
      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    if (action === "logout") {
      const response = NextResponse.json({ success: true });
      response.cookies.delete("auth_token");
      return response;
    }

    if (action === "verify") {
      const token = req.cookies.get("auth_token")?.value;
      if (!token) return NextResponse.json({ valid: false });
      try {
        await jwtVerify(token, SECRET);
        return NextResponse.json({ valid: true });
      } catch {
        return NextResponse.json({ valid: false });
      }
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
