/**
 * FILE-BASED MEMORY STORE
 * Reads/writes structured JSON files. Never stores raw conversations.
 * Each agent receives only the slice it needs.
 */

import fs from "fs";
import path from "path";
import type {
  Brand,
  Competitor,
  AudienceProfile,
  TrendItem,
  ContentStrategy,
  ContentItem,
  Lead,
  CalendarEvent,
  AnalyticsSnapshot,
  Settings,
} from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read<T>(file: string, fallback: T): T {
  ensureDir();
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(fp, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function write<T>(file: string, data: T): void {
  ensureDir();
  fs.writeFileSync(
    path.join(DATA_DIR, file),
    JSON.stringify(data, null, 2),
    "utf-8"
  );
}

// ─── DEFAULT SETTINGS ────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: Settings = {
  imageProvider: "openai",
  language: "tr",
  theme: "dark",
  autoSchedule: false,
  nightly_jobs: true,
};

// ─── MEMORY API ──────────────────────────────────────────────────────────────
export const memory = {
  // Brand
  getBrand: () => read<Brand | null>("brand.json", null),
  saveBrand: (b: Brand) => write("brand.json", b),

  // Competitors
  getCompetitors: () => read<Competitor[]>("competitors.json", []),
  saveCompetitors: (c: Competitor[]) => write("competitors.json", c),
  addCompetitor: (c: Competitor) => {
    const list = memory.getCompetitors();
    const idx = list.findIndex((x) => x.id === c.id);
    if (idx >= 0) list[idx] = c;
    else list.push(c);
    memory.saveCompetitors(list);
  },

  // Audience
  getAudience: () => read<AudienceProfile | null>("audience.json", null),
  saveAudience: (a: AudienceProfile) => write("audience.json", a),

  // Trends
  getTrends: () => read<TrendItem[]>("trends.json", []),
  saveTrends: (t: TrendItem[]) => write("trends.json", t),

  // Strategy
  getStrategy: () => read<ContentStrategy | null>("strategy.json", null),
  saveStrategy: (s: ContentStrategy) => write("strategy.json", s),

  // Content History (last 90 days enforced on read)
  getContentHistory: () => {
    const all = read<ContentItem[]>("content_history.json", []);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    return all.filter((c) => new Date(c.createdAt) >= cutoff);
  },
  addContent: (c: ContentItem) => {
    const list = read<ContentItem[]>("content_history.json", []);
    const idx = list.findIndex((x) => x.id === c.id);
    if (idx >= 0) list[idx] = c;
    else list.push(c);
    write("content_history.json", list);
  },
  updateContent: (id: string, patch: Partial<ContentItem>) => {
    const list = read<ContentItem[]>("content_history.json", []);
    const idx = list.findIndex((x) => x.id === id);
    if (idx >= 0) list[idx] = { ...list[idx], ...patch };
    write("content_history.json", list);
  },

  // Leads
  getLeads: () => read<Lead[]>("leads.json", []),
  saveLeads: (l: Lead[]) => write("leads.json", l),
  addLead: (l: Lead) => {
    const list = memory.getLeads();
    const idx = list.findIndex((x) => x.id === l.id);
    if (idx >= 0) list[idx] = l;
    else list.push(l);
    memory.saveLeads(list);
  },

  // Calendar
  getCalendar: () => read<CalendarEvent[]>("calendar.json", []),
  saveCalendar: (c: CalendarEvent[]) => write("calendar.json", c),
  addCalendarEvent: (e: CalendarEvent) => {
    const list = memory.getCalendar();
    const idx = list.findIndex((x) => x.id === e.id);
    if (idx >= 0) list[idx] = e;
    else list.push(e);
    memory.saveCalendar(list);
  },

  // Analytics
  getAnalytics: () => read<AnalyticsSnapshot[]>("analytics.json", []),
  addAnalyticsSnapshot: (s: AnalyticsSnapshot) => {
    const list = memory.getAnalytics();
    list.push(s);
    // keep last 365 days
    const sorted = list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    write("analytics.json", sorted.slice(0, 365));
  },

  // Settings
  getSettings: () => read<Settings>("settings.json", DEFAULT_SETTINGS),
  saveSettings: (s: Partial<Settings>) => {
    const current = memory.getSettings();
    write("settings.json", { ...current, ...s });
  },
};
