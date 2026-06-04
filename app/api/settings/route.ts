import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/memory/store";

// Keys that should never be sent to the client in plaintext
const SENSITIVE_KEYS = ["openaiApiKey", "geminiApiKey", "instagramAccessToken", "bufferAccessToken"];

export async function GET() {
  const settings = await memory.getSettings();

  // Replace sensitive values with boolean flags (true = set, false/undefined = not set)
  // This prevents masked values from being accidentally saved back
  const safe: Record<string, unknown> = { ...(settings as unknown as Record<string, unknown>) };
  for (const key of SENSITIVE_KEYS) {
    safe[key] = !!safe[key] ? "__SET__" : undefined;
  }

  return NextResponse.json(safe);
}

export async function POST(req: NextRequest) {
  try {
    const body: Record<string, unknown> = await req.json();

    // Get current stored settings first
    const current = await memory.getSettings();
    const currentMap = current as unknown as Record<string, unknown>;

    const SENSITIVE = ["openaiApiKey", "geminiApiKey", "instagramAccessToken", "bufferAccessToken", "instagramAppSecret"];

    // Strip out placeholder/masked/empty values for sensitive keys
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (SENSITIVE.includes(k)) {
        // Skip if: placeholder sentinel, masked value, or EMPTY STRING
        if (!v || v === "__SET__" || String(v).includes("****")) {
          // Keep the existing stored value — don't overwrite with empty/placeholder
          if (currentMap[k]) clean[k] = currentMap[k];
          continue;
        }
      }
      clean[k] = v;
    }

    await memory.saveSettings(clean as never);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
