import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/memory/store";

export async function GET() {
  const settings = await memory.getSettings();
  return NextResponse.json({
    ...settings,
    openaiApiKey: settings.openaiApiKey ? "sk-...****" : undefined,
    geminiApiKey: settings.geminiApiKey ? "AIza...****" : undefined,
    instagramAccessToken: settings.instagramAccessToken ? "EAAG...****" : undefined,
  });
}

export async function POST(req: NextRequest) {
  try {
    await memory.saveSettings(await req.json());
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
