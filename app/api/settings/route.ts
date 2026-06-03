import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/memory/store";

export async function GET() {
  const settings = memory.getSettings();
  // Mask API keys
  const masked = {
    ...settings,
    openaiApiKey: settings.openaiApiKey ? "sk-...****" : undefined,
    anthropicApiKey: settings.anthropicApiKey ? "sk-ant-...****" : undefined,
    geminiApiKey: settings.geminiApiKey ? "AI...****" : undefined,
    instagramAccessToken: settings.instagramAccessToken ? "EAAG...****" : undefined,
  };
  return NextResponse.json(masked);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    memory.saveSettings(body);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
