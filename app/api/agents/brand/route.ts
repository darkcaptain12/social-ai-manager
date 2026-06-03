import { NextRequest, NextResponse } from "next/server";
import { analyzeBrand, getBrandInsights } from "@/lib/agents/brandAgent";
import { memory } from "@/lib/memory/store";

export async function GET() {
  const brand = memory.getBrand();
  return NextResponse.json({ brand });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;

    if (action === "analyze") {
      const brand = await analyzeBrand(payload);
      return NextResponse.json({ success: true, brand });
    }

    if (action === "insights") {
      const insights = await getBrandInsights();
      return NextResponse.json({ success: true, insights });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
