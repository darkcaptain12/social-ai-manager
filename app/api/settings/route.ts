import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/memory/store";

// Keys that should never be sent to the client in plaintext
const SENSITIVE_KEYS = ["openaiApiKey", "geminiApiKey", "instagramAccessToken", "bufferAccessToken"];

export async function GET() {
  const settings = await memory.getSettings();

  // Replace sensitive values with boolean flags (true = set, false/undefined = not set)
  // This prevents masked values from being accidentally saved back
  const safe: Record<string, unknown> = { ...settings };
  for (const key of SENSITIVE_KEYS) {
    safe[key] = !!(settings as Record<string, unknown>)[key] ? "__SET__" : undefined;
  }

  return NextResponse.json(safe);
}

export async function POST(req: NextRequest) {
  try {
    const body: Record<string, unknown> = await req.json();

    // Strip out placeholder/masked values — never overwrite real keys with fake ones
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (
        v === "__SET__" ||
        v === "sk-...****" ||
        v === "AIza...****" ||
        v === "EAAG...****" ||
        v === "sk-ant-...****"
      ) {
        // Skip — don't overwrite the stored real value
        continue;
      }
      clean[k] = v;
    }

    await memory.saveSettings(clean as never);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
