import { NextRequest, NextResponse } from "next/server";
import { scoreLead, generateLeads, getFollowUpTasks } from "@/lib/agents/crmAgent";
import { memory } from "@/lib/memory/store";
import type { Lead } from "@/types";

export async function GET() {
  const leads = memory.getLeads();
  return NextResponse.json({ leads });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;

    if (action === "score") {
      const result = await scoreLead(payload.lead);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "generate") {
      const leads = await generateLeads(payload);
      return NextResponse.json({ success: true, leads });
    }

    if (action === "tasks") {
      const tasks = await getFollowUpTasks();
      return NextResponse.json({ success: true, ...tasks });
    }

    if (action === "add") {
      const lead = payload.lead as Lead;
      memory.addLead(lead);
      return NextResponse.json({ success: true });
    }

    if (action === "update") {
      const leads = memory.getLeads();
      const idx = leads.findIndex((l) => l.id === payload.id);
      if (idx >= 0) {
        leads[idx] = { ...leads[idx], ...payload.patch, updatedAt: new Date().toISOString() };
        memory.saveLeads(leads);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      const leads = memory.getLeads().filter((l) => l.id !== payload.id);
      memory.saveLeads(leads);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
