import { NextResponse } from "next/server";
import { generateStrategy } from "@/lib/agents/strategyAgent";
import { memory } from "@/lib/memory/store";

export async function GET() {
  return NextResponse.json({ strategy: await memory.getStrategy() });
}

export async function POST() {
  try {
    return NextResponse.json({ success: true, strategy: await generateStrategy() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
