import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/memory/store";
import { generateId } from "@/lib/utils";
import type { CalendarEvent } from "@/types";

export async function GET() {
  const calendar = memory.getCalendar();
  return NextResponse.json({ calendar });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;

    if (action === "schedule") {
      const event: CalendarEvent = {
        id: generateId(),
        contentId: payload.contentId,
        title: payload.title,
        type: payload.type,
        scheduledAt: payload.scheduledAt,
        status: "scheduled",
        color: payload.color,
      };
      memory.addCalendarEvent(event);
      memory.updateContent(payload.contentId, {
        status: "scheduled",
        scheduledAt: payload.scheduledAt,
      });
      return NextResponse.json({ success: true, event });
    }

    if (action === "unschedule") {
      const calendar = memory.getCalendar().filter((e) => e.id !== payload.id);
      memory.saveCalendar(calendar);
      if (payload.contentId) {
        memory.updateContent(payload.contentId, { status: "draft", scheduledAt: undefined });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "update") {
      const calendar = memory.getCalendar();
      const idx = calendar.findIndex((e) => e.id === payload.id);
      if (idx >= 0) calendar[idx] = { ...calendar[idx], ...payload.patch };
      memory.saveCalendar(calendar);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
