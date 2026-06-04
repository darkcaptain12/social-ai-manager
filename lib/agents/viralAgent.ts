import { runAI, parseJSON } from "./base";
import { memory } from "@/lib/memory/store";
import { generateId } from "@/lib/utils";
import type { TrendItem } from "@/types";

const SYSTEM = `You are a Viral Content Intelligence Agent for Instagram. Detect trending formats and viral patterns. ALWAYS return valid JSON only.`;

export async function detectTrends(): Promise<TrendItem[]> {
  const brand = await memory.getBrand();
  const existing = await memory.getTrends();

  const prompt = `Detect current Instagram viral trends for the ${brand?.niche ?? "general"} niche.
Date: ${new Date().toISOString()}
Market: ${brand?.language === "tr" ? "Turkish Instagram" : "Global Instagram"}

Return a JSON object with a "trends" array containing 8-10 items:
{
  "trends": [
    {
      "id": "unique_id",
      "title": "Trend title",
      "description": "What this trend is about",
      "format": "reel",
      "hook": "The viral hook formula for this trend",
      "viralScore": 85,
      "niche": "general",
      "detectedAt": "${new Date().toISOString()}",
      "expiresAt": "${new Date(Date.now() + 21 * 86400000).toISOString()}"
    }
  ]
}
format must be one of: reel, carousel, single_image, story
viralScore is 1-100`;

  const raw = await runAI(SYSTEM, prompt);
  const parsed = parseJSON<{ trends?: TrendItem[] } | TrendItem[]>(raw, { trends: [] });

  // Handle both { trends: [] } and direct array responses
  const list: TrendItem[] = Array.isArray(parsed)
    ? parsed
    : (parsed as { trends?: TrendItem[] }).trends ?? [];

  const trends = list.map((t) => ({ ...t, id: t.id || generateId() }));

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
  const prompt = `Create a viral content template for this Instagram trend for our brand.
Trend: ${JSON.stringify(trend)}
Brand: ${JSON.stringify({ name: brand?.name, niche: brand?.niche, tone: brand?.toneOfVoice, language: brand?.language })}

Return JSON:
{
  "template": "Fill-in-the-blank template with [PLACEHOLDERS]",
  "hooks": ["hook 1", "hook 2", "hook 3", "hook 4", "hook 5"],
  "adaptedCaption": "Full caption using this trend format for our brand"
}`;

  const raw = await runAI(SYSTEM, prompt);
  return parseJSON(raw, { template: "", hooks: [], adaptedCaption: "" });
}
