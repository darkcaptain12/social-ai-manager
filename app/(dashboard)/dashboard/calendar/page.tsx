"use client";

import { useEffect, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-brand-600",
  published: "bg-emerald-600",
  failed: "bg-red-600",
  draft: "bg-gray-600",
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    fetch("/api/scheduler")
      .then((r) => r.json())
      .then((d) => setEvents(d.calendar ?? []));
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad to start on Monday
  const startDayOfWeek = (monthStart.getDay() + 6) % 7;
  const paddedDays = [...Array(startDayOfWeek).fill(null), ...days];

  function getEventsForDay(day: Date) {
    return events.filter((e) => isSameDay(new Date(e.scheduledAt), day));
  }

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-700/30 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Yayın Takvimi</h2>
            <p className="text-sm text-gray-500">{events.length} planlanmış içerik</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white capitalize">
              {format(currentDate, "MMMM yyyy", { locale: tr })}
            </h3>
            <div className="flex gap-1">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="btn-ghost p-1.5">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="btn-ghost text-xs px-2">Bugün</button>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="btn-ghost p-1.5">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
              <div key={d} className="text-center text-xs text-gray-600 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, idx) => {
              if (!day) return <div key={`pad-${idx}`} />;
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "min-h-[60px] rounded-lg p-1 text-left transition-all border",
                    isCurrentMonth ? "text-gray-300" : "text-gray-700",
                    isSelected ? "bg-brand-950 border-brand-700" : "border-transparent hover:bg-surface-muted",
                    isToday && "border-brand-600"
                  )}
                >
                  <span className={cn(
                    "text-xs font-medium block mb-1",
                    isToday && "text-brand-400 font-bold"
                  )}>
                    {format(day, "d")}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div key={e.id} className={cn(
                        "text-xs rounded px-1 py-0.5 truncate text-white",
                        STATUS_COLORS[e.status]
                      )}>
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-xs text-gray-600">+{dayEvents.length - 2}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {selectedDay ? (
            <div className="card space-y-3">
              <h3 className="font-semibold text-white">
                {format(selectedDay, "d MMMM", { locale: tr })}
              </h3>
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-gray-500">Bu güne ait içerik yok</p>
              ) : (
                selectedDayEvents.map((e) => (
                  <div key={e.id} className="bg-surface-muted rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", STATUS_COLORS[e.status])} />
                      <p className="text-sm font-medium text-white truncate">{e.title}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {format(new Date(e.scheduledAt), "HH:mm")}
                    </div>
                    <span className="badge badge-blue capitalize">{e.type}</span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="card">
              <p className="text-sm text-gray-500">Detay görmek için bir gün seçin</p>
            </div>
          )}

          {/* Legend */}
          <div className="card space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase">Durum Renkleri</h4>
            {Object.entries(STATUS_COLORS).map(([status, cls]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-sm", cls)} />
                <span className="text-xs text-gray-400 capitalize">{status}</span>
              </div>
            ))}
          </div>

          {/* Upcoming */}
          <div className="card space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase">Yaklaşanlar</h4>
            {events
              .filter((e) => new Date(e.scheduledAt) > new Date())
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
              .slice(0, 5)
              .map((e) => (
                <div key={e.id} className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_COLORS[e.status])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 truncate">{e.title}</p>
                    <p className="text-xs text-gray-600">{format(new Date(e.scheduledAt), "d MMM HH:mm", { locale: tr })}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
