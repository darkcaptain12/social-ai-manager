import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/memory/store";
import { generateId } from "@/lib/utils";
import type { CalendarEvent } from "@/types";

export async function GET() {
  return NextResponse.json({ calendar: await memory.getCalendar() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;
    if (action === "schedule") {
      const event: CalendarEvent = {
        id: generateId(), contentId: payload.contentId, title: payload.title,
        type: payload.type, scheduledAt: payload.scheduledAt, status: "scheduled", color: payload.color,
      };
      await memory.addCalendarEvent(event);
      await memory.updateContent(payload.contentId, { status: "scheduled", scheduledAt: payload.scheduledAt });
      return NextResponse.json({ success: true, event });
    }
    if (action === "unschedule") {
      await memory.saveCalendar((await memory.getCalendar()).filter((e) => e.id !== payload.id));
      if (payload.contentId) await memory.updateContent(payload.contentId, { status: "draft" });
      return NextResponse.json({ success: true });
    }
    if (action === "update") {
      const cal = await memory.getCalendar();
      const idx = cal.findIndex((e) => e.id === payload.id);
      if (idx >= 0) cal[idx] = { ...cal[idx], ...payload.patch };
      await memory.saveCalendar(cal);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
