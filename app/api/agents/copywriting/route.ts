import { NextRequest, NextResponse } from "next/server";
import { generateCopy, checkDuplication } from "@/lib/agents/copywritingAgent";
import { memory } from "@/lib/memory/store";

export async function GET() {
  const history = memory.getContentHistory();
  return NextResponse.json({ history });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;

    if (action === "generate") {
      const content = await generateCopy(payload);
      return NextResponse.json({ success: true, content });
    }

    if (action === "check_duplicate") {
      const result = await checkDuplication(payload.hook);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "update") {
      memory.updateContent(payload.id, payload.patch);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
