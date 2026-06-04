/**
 * HYBRID MEMORY STORE
 * - Vercel (production): uses @vercel/kv (Redis)
 * - Local dev: falls back to JSON files in /data
 *
 * Each agent receives only the slice it needs.
 * Never stores raw conversations — structured JSON only.
 */

import type {
  Brand, Competitor, AudienceProfile, TrendItem,
  ContentStrategy, ContentItem, Lead, CalendarEvent,
  AnalyticsSnapshot, Settings,
} from "@/types";

// ─── DETECT ENVIRONMENT ───────────────────────────────────────────────────────
const IS_VERCEL = !!(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

// ─── KV BACKEND (Vercel) ──────────────────────────────────────────────────────
async function kvGet<T>(key: string, fallback: T): Promise<T> {
  const { kv } = await import("@vercel/kv");
  const val = await kv.get<T>(key);
  return val ?? fallback;
}

async function kvSet(key: string, value: unknown): Promise<void> {
  const { kv } = await import("@vercel/kv");
  await kv.set(key, value);
}

// ─── FILE BACKEND (Local) ─────────────────────────────────────────────────────
function fileRead<T>(file: string, fallback: T): T {
  // Dynamic require so Next.js doesn't bundle `fs` into client chunks
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const fp = path.join(dir, file);
  if (!fs.existsSync(fp)) return fallback;
  try { return JSON.parse(fs.readFileSync(fp, "utf-8")) as T; }
  catch { return fallback; }
}

function fileWrite(file: string, value: unknown): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, file), JSON.stringify(value, null, 2), "utf-8");
}

// ─── UNIFIED READ / WRITE ─────────────────────────────────────────────────────
async function read<T>(key: string, fallback: T): Promise<T> {
  if (IS_VERCEL) return kvGet<T>(key, fallback);
  return fileRead<T>(`${key}.json`, fallback);
}

async function write(key: string, value: unknown): Promise<void> {
  if (IS_VERCEL) return kvSet(key, value);
  fileWrite(`${key}.json`, value);
}

// ─── DEFAULT SETTINGS ─────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: Settings = {
  imageProvider: "openai",
  language: "tr",
  theme: "dark",
  autoSchedule: false,
  nightly_jobs: true,
};

// ─── MEMORY API ───────────────────────────────────────────────────────────────
export const memory = {
  // Brand
  getBrand: () => read<Brand | null>("brand", null),
  saveBrand: (b: Brand) => write("brand", b),

  // Competitors
  getCompetitors: () => read<Competitor[]>("competitors", []),
  saveCompetitors: (c: Competitor[]) => write("competitors", c),
  addCompetitor: async (c: Competitor) => {
    const list = await memory.getCompetitors();
    const idx = list.findIndex((x) => x.id === c.id);
    if (idx >= 0) list[idx] = c; else list.push(c);
    await memory.saveCompetitors(list);
  },

  // Audience
  getAudience: () => read<AudienceProfile | null>("audience", null),
  saveAudience: (a: AudienceProfile) => write("audience", a),

  // Trends
  getTrends: () => read<TrendItem[]>("trends", []),
  saveTrends: (t: TrendItem[]) => write("trends", t),

  // Strategy
  getStrategy: () => read<ContentStrategy | null>("strategy", null),
  saveStrategy: (s: ContentStrategy) => write("strategy", s),

  // Content history (last 90 days)
  getContentHistory: async () => {
    const all = await read<ContentItem[]>("content_history", []);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    return all.filter((c) => new Date(c.createdAt) >= cutoff);
  },
  addContent: async (c: ContentItem) => {
    const list = await read<ContentItem[]>("content_history", []);
    const idx = list.findIndex((x) => x.id === c.id);
    if (idx >= 0) list[idx] = c; else list.push(c);
    await write("content_history", list);
  },
  updateContent: async (id: string, patch: Partial<ContentItem>) => {
    const list = await read<ContentItem[]>("content_history", []);
    const idx = list.findIndex((x) => x.id === id);
    if (idx >= 0) list[idx] = { ...list[idx], ...patch };
    await write("content_history", list);
  },

  // Leads
  getLeads: () => read<Lead[]>("leads", []),
  saveLeads: (l: Lead[]) => write("leads", l),
  addLead: async (l: Lead) => {
    const list = await memory.getLeads();
    const idx = list.findIndex((x) => x.id === l.id);
    if (idx >= 0) list[idx] = l; else list.push(l);
    await memory.saveLeads(list);
  },

  // Calendar
  getCalendar: () => read<CalendarEvent[]>("calendar", []),
  saveCalendar: (c: CalendarEvent[]) => write("calendar", c),
  addCalendarEvent: async (e: CalendarEvent) => {
    const list = await memory.getCalendar();
    const idx = list.findIndex((x) => x.id === e.id);
    if (idx >= 0) list[idx] = e; else list.push(e);
    await memory.saveCalendar(list);
  },

  // Analytics
  getAnalytics: () => read<AnalyticsSnapshot[]>("analytics", []),
  addAnalyticsSnapshot: async (s: AnalyticsSnapshot) => {
    const list = await memory.getAnalytics();
    list.push(s);
    const sorted = list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    await write("analytics", sorted.slice(0, 365));
  },

  // Settings
  getSettings: () => read<Settings>("settings", DEFAULT_SETTINGS),
  saveSettings: async (s: Partial<Settings>) => {
    const current = await memory.getSettings();
    await write("settings", { ...current, ...s });
  },
};
