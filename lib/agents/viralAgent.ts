import { runClaude, parseJSON } from "./base";
import { memory } from "@/lib/memory/store";
import { generateId } from "@/lib/utils";
import type { TrendItem } from "@/types";

const SYSTEM = `You are a Viral Content Intelligence Agent for Instagram.
Detect trending formats, viral patterns, and engagement hooks.
ALWAYS return valid JSON only.`;

export async function detectTrends(): Promise<TrendItem[]> {
  const brand = memory.getBrand();
  const existing = memory.getTrends();

  const prompt = `Detect current Instagram viral content trends for the ${brand?.niche ?? "general"} niche.
Current date: ${new Date().toISOString()}
Language market: ${brand?.language === "tr" ? "Turkish/Turkish Instagram" : "Global Instagram"}

Return JSON array of 8-10 trends:
[{
  "id": string,
  "title": string,
  "description": string,
  "format": "reel|carousel|single_image|story",
  "hook": string (viral hook formula),
  "viralScore": 1-100,
  "niche": string,
  "detectedAt": ISO_date,
  "expiresAt": ISO_date (2-4 weeks from now)
}]`;

  const raw = await runClaude(SYSTEM, prompt);
  const parsed = parseJSON<TrendItem[]>(raw, []);
  const trends = parsed.map((t) => ({ ...t, id: t.id || generateId() }));

  // Merge with existing, keep newest
  const all = [...trends, ...existing];
  const unique = all.filter(
    (t, i, self) => i === self.findIndex((x) => x.title === t.title)
  );
  const valid = unique
    .filter((t) => !t.expiresAt || new Date(t.expiresAt) > new Date())
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 20);

  memory.saveTrends(valid);
  return valid;
}

export async function generateViralTemplate(trend: TrendItem): Promise<{
  template: string;
  hooks: string[];
  adaptedCaption: string;
}> {
  const brand = memory.getBrand();

  const prompt = `Create a reusable viral content template based on this trend for our brand.

Trend: ${JSON.stringify(trend)}
Brand: ${JSON.stringify({ name: brand?.name, niche: brand?.niche, tone: brand?.toneOfVoice, language: brand?.language })}

Return JSON:
{
  "template": string (fill-in-the-blank template with [PLACEHOLDERS]),
  "hooks": [5 adapted hook variations for our brand],
  "adaptedCaption": string (full caption using this trend format)
}`;

  const raw = await runClaude(SYSTEM, prompt);
  return parseJSON(raw, { template: "", hooks: [], adaptedCaption: "" });
}
