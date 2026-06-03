import { NextRequest, NextResponse } from "next/server";
import { analyzeCompetitor, getCompetitiveReport } from "@/lib/agents/competitorAgent";
import { memory } from "@/lib/memory/store";

export async function GET() {
  const competitors = memory.getCompetitors();
  return NextResponse.json({ competitors });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;

    if (action === "analyze") {
      const competitor = await analyzeCompetitor(payload);
      return NextResponse.json({ success: true, competitor });
    }

    if (action === "report") {
      const report = await getCompetitiveReport();
      return NextResponse.json({ success: true, report });
    }

    if (action === "delete") {
      const competitors = memory.getCompetitors().filter((c) => c.id !== payload.id);
      memory.saveCompetitors(competitors);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
