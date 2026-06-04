import { NextRequest, NextResponse } from "next/server";
import { scoreLead, generateLeads, getFollowUpTasks } from "@/lib/agents/crmAgent";
import { memory } from "@/lib/memory/store";
import type { Lead } from "@/types";

export async function GET() {
  return NextResponse.json({ leads: await memory.getLeads() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;
    if (action === "score") return NextResponse.json({ success: true, ...(await scoreLead(payload.lead)) });
    if (action === "generate") return NextResponse.json({ success: true, leads: await generateLeads(payload) });
    if (action === "tasks") return NextResponse.json({ success: true, ...(await getFollowUpTasks()) });
    if (action === "add") { await memory.addLead(payload.lead as Lead); return NextResponse.json({ success: true }); }
    if (action === "update") {
      const leads = await memory.getLeads();
      const idx = leads.findIndex((l) => l.id === payload.id);
      if (idx >= 0) leads[idx] = { ...leads[idx], ...payload.patch, updatedAt: new Date().toISOString() };
      await memory.saveLeads(leads);
      return NextResponse.json({ success: true });
    }
    if (action === "delete") {
      await memory.saveLeads((await memory.getLeads()).filter((l) => l.id !== payload.id));
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
