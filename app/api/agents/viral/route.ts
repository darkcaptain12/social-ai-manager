import { NextRequest, NextResponse } from "next/server";
import { detectTrends, generateViralTemplate } from "@/lib/agents/viralAgent";
import { memory } from "@/lib/memory/store";

export async function GET() {
  const trends = memory.getTrends();
  return NextResponse.json({ trends });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;

    if (action === "detect") {
      const trends = await detectTrends();
      return NextResponse.json({ success: true, trends });
    }

    if (action === "template") {
      const result = await generateViralTemplate(payload.trend);
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
