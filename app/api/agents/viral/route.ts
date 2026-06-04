import { NextRequest, NextResponse } from "next/server";
import { detectTrends, generateViralTemplate } from "@/lib/agents/viralAgent";
import { memory } from "@/lib/memory/store";

export async function GET() {
  return NextResponse.json({ trends: await memory.getTrends() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;
    if (action === "detect") return NextResponse.json({ success: true, trends: await detectTrends() });
    if (action === "template") return NextResponse.json({ success: true, ...(await generateViralTemplate(payload.trend)) });
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
