import { NextRequest, NextResponse } from "next/server";
import {
  getBufferUser,
  getInstagramProfiles,
  createBufferPost,
  getBufferQueue,
  getBufferSent,
  deleteBufferPost,
} from "@/lib/integrations/buffer";
import { memory } from "@/lib/memory/store";

function getToken(settings: Awaited<ReturnType<typeof memory.getSettings>>) {
  return settings.bufferAccessToken;
}

export async function GET(req: NextRequest) {
  const action = new URL(req.url).searchParams.get("action");
  const profileId = new URL(req.url).searchParams.get("profileId");

  try {
    const settings = await memory.getSettings();
    const token = getToken(settings);
    if (!token) return NextResponse.json({ connected: false });

    if (action === "profiles") {
      const profiles = await getInstagramProfiles(token);
      return NextResponse.json({ connected: true, profiles });
    }

    if (action === "queue" && profileId) {
      const updates = await getBufferQueue(token, profileId);
      return NextResponse.json({ connected: true, updates });
    }

    if (action === "sent" && profileId) {
      const updates = await getBufferSent(token, profileId);
      return NextResponse.json({ connected: true, updates });
    }

    // Default: verify connection
    const user = await getBufferUser(token);
    const profiles = await getInstagramProfiles(token);
    return NextResponse.json({ connected: true, user, profiles });
  } catch (err) {
    return NextResponse.json(
      { connected: false, error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const settings = await memory.getSettings();
    const token = getToken(settings);

    if (action === "connect") {
      // Save token and verify it works
      const user = await getBufferUser(body.token);
      const profiles = await getInstagramProfiles(body.token);
      await memory.saveSettings({
        bufferAccessToken: body.token,
        bufferProfileId: profiles[0]?.id ?? "",
      });
      return NextResponse.json({ success: true, user, profiles });
    }

    if (action === "disconnect") {
      await memory.saveSettings({ bufferAccessToken: undefined, bufferProfileId: undefined });
      return NextResponse.json({ success: true });
    }

    if (action === "set_profile") {
      await memory.saveSettings({ bufferProfileId: body.profileId });
      return NextResponse.json({ success: true });
    }

    if (!token) return NextResponse.json({ error: "Buffer not connected" }, { status: 401 });

    if (action === "post") {
      // Ensure profileId is set
      const profileId = body.profileId ?? settings.bufferProfileId;
      if (!profileId) return NextResponse.json({ error: "No Instagram profile selected" }, { status: 400 });

      const updates = await createBufferPost(token, {
        profileIds: [profileId],
        text: body.text,
        mediaUrl: body.mediaUrl,
        scheduledAt: body.scheduledAt,
        now: body.now ?? false,
      });

      // Update content status if contentId provided
      if (body.contentId) {
        await memory.updateContent(body.contentId, {
          status: body.scheduledAt ? "scheduled" : "published",
          scheduledAt: body.scheduledAt,
          publishedAt: body.now ? new Date().toISOString() : undefined,
        });
      }

      return NextResponse.json({ success: true, updates });
    }

    if (action === "delete") {
      await deleteBufferPost(token, body.updateId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
