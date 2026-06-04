import { runClaude, parseJSON } from "./base";
import { memory } from "@/lib/memory/store";
import { generateId } from "@/lib/utils";
import type { TrendItem } from "@/types";

const SYSTEM = `You are a Viral Content Intelligence Agent. Detect Instagram trends and viral patterns. ALWAYS return valid JSON only.`;

export async function detectTrends(): Promise<TrendItem[]> {
  const brand = await memory.getBrand();
  const existing = await memory.getTrends();

  const prompt = `Detect current Instagram viral trends for the ${brand?.niche ?? "general"} niche.
Date: ${new Date().toISOString()}
Market: ${brand?.language === "tr" ? "Turkish Instagram" : "Global Instagram"}
Return JSON array of 8-10 trends:
[{ "id": string, "title": string, "description": string, "format": "reel|carousel|single_image|story", "hook": string, "viralScore": 1-100, "niche": string, "detectedAt": ISO, "expiresAt": ISO (2-4 weeks) }]`;

  const raw = await runClaude(SYSTEM, prompt);
  const parsed = parseJSON<TrendItem[]>(raw, []);
  const trends = parsed.map((t) => ({ ...t, id: t.id || generateId() }));

  const all = [...trends, ...existing];
  const unique = all.filter((t, i, s) => i === s.findIndex((x) => x.title === t.title));
  const valid = unique
    .filter((t) => !t.expiresAt || new Date(t.expiresAt) > new Date())
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 20);

  await memory.saveTrends(valid);
  return valid;
}

export async function generateViralTemplate(trend: TrendItem): Promise<{
  template: string; hooks: string[]; adaptedCaption: string;
}> {
  const brand = await memory.getBrand();
  const prompt = `Create a viral content template for this trend for our brand.
Trend: ${JSON.stringify(trend)}
Brand: ${JSON.stringify({ name: brand?.name, niche: brand?.niche, tone: brand?.toneOfVoice, language: brand?.language })}
Return JSON: { "template": string (with [PLACEHOLDERS]), "hooks": [5 adapted variations], "adaptedCaption": string }`;

  const raw = await runClaude(SYSTEM, prompt);
  return parseJSON(raw, { template: "", hooks: [], adaptedCaption: "" });
}
