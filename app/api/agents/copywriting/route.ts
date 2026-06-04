import { NextRequest, NextResponse } from "next/server";
import { generateCopy, checkDuplication } from "@/lib/agents/copywritingAgent";
import { memory } from "@/lib/memory/store";

export async function GET() {
  return NextResponse.json({ history: await memory.getContentHistory() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;
    if (action === "generate") return NextResponse.json({ success: true, content: await generateCopy(payload) });
    if (action === "check_duplicate") return NextResponse.json({ success: true, ...(await checkDuplication(payload.hook)) });
    if (action === "update") { await memory.updateContent(payload.id, payload.patch); return NextResponse.json({ success: true }); }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
