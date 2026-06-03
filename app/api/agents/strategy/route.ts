import { NextResponse } from "next/server";
import { generateStrategy } from "@/lib/agents/strategyAgent";
import { memory } from "@/lib/memory/store";

export async function GET() {
  const strategy = memory.getStrategy();
  return NextResponse.json({ strategy });
}

export async function POST() {
  try {
    const strategy = await generateStrategy();
    return NextResponse.json({ success: true, strategy });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
