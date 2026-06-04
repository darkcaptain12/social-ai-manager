import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/memory/store";

const IG_BASE = "https://graph.instagram.com/v19.0";

async function igFetch(path: string, token: string) {
  const res = await fetch(`${IG_BASE}${path}&access_token=${token}`);
  if (!res.ok) throw new Error(`Instagram API error: ${res.statusText}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  const action = new URL(req.url).searchParams.get("action");
  try {
    const settings = await memory.getSettings();
    const token = settings.instagramAccessToken;
    if (!token) return NextResponse.json({ connected: false });

    if (action === "profile") {
      const data = await igFetch("/me?fields=id,username,followers_count,media_count", token);
      return NextResponse.json({ connected: true, profile: data });
    }
    if (action === "media") {
      const data = await igFetch("/me/media?fields=id,caption,media_type,timestamp,like_count,comments_count", token);
      return NextResponse.json({ connected: true, media: data.data });
    }
    return NextResponse.json({ connected: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "connect") {
      await memory.saveSettings({ instagramAccessToken: body.accessToken, instagramAccountId: body.accountId });
      return NextResponse.json({ success: true });
    }
    if (body.action === "disconnect") {
      await memory.saveSettings({ instagramAccessToken: undefined, instagramAccountId: undefined });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
