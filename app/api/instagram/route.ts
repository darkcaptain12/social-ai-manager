import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/memory/store";

const IG_BASE = "https://graph.instagram.com/v19.0";

function getToken() {
  const settings = memory.getSettings();
  return settings.instagramAccessToken;
}

async function igFetch(path: string, token?: string) {
  const t = token ?? getToken();
  if (!t) throw new Error("Instagram not connected");
  const res = await fetch(`${IG_BASE}${path}&access_token=${t}`);
  if (!res.ok) throw new Error(`Instagram API error: ${res.statusText}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    const token = getToken();
    if (!token) return NextResponse.json({ connected: false });

    if (action === "profile") {
      const data = await igFetch("/me?fields=id,username,followers_count,media_count");
      return NextResponse.json({ connected: true, profile: data });
    }

    if (action === "media") {
      const data = await igFetch("/me/media?fields=id,caption,media_type,timestamp,like_count,comments_count");
      return NextResponse.json({ connected: true, media: data.data });
    }

    if (action === "insights") {
      const settings = memory.getSettings();
      const accountId = settings.instagramAccountId;
      if (!accountId) return NextResponse.json({ error: "No account ID" }, { status: 400 });
      const data = await igFetch(`/${accountId}/insights?metric=follower_count,reach,impressions&period=day`);
      return NextResponse.json({ connected: true, insights: data.data });
    }

    return NextResponse.json({ connected: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "connect") {
      memory.saveSettings({
        instagramAccessToken: body.accessToken,
        instagramAccountId: body.accountId,
      });
      return NextResponse.json({ success: true });
    }

    if (action === "disconnect") {
      memory.saveSettings({
        instagramAccessToken: undefined,
        instagramAccountId: undefined,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
