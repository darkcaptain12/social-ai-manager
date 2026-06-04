import { NextRequest, NextResponse } from "next/server";
import { analyzeCompetitor, getCompetitiveReport } from "@/lib/agents/competitorAgent";
import { memory } from "@/lib/memory/store";

export async function GET() {
  return NextResponse.json({ competitors: await memory.getCompetitors() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;
    if (action === "analyze") return NextResponse.json({ success: true, competitor: await analyzeCompetitor(payload) });
    if (action === "report") return NextResponse.json({ success: true, report: await getCompetitiveReport() });
    if (action === "delete") {
      const list = (await memory.getCompetitors()).filter((c) => c.id !== payload.id);
      await memory.saveCompetitors(list);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
