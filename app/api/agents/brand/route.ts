import { NextRequest, NextResponse } from "next/server";
import { analyzeBrand, getBrandInsights } from "@/lib/agents/brandAgent";
import { memory } from "@/lib/memory/store";

export async function GET() {
  const brand = await memory.getBrand();
  return NextResponse.json({ brand });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;
    if (action === "analyze") return NextResponse.json({ success: true, brand: await analyzeBrand(payload) });
    if (action === "insights") return NextResponse.json({ success: true, insights: await getBrandInsights() });
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
