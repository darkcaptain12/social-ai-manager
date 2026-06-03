import { runClaude, parseJSON } from "./base";
import { memory } from "@/lib/memory/store";
import { generateId } from "@/lib/utils";
import type { Brand } from "@/types";

const SYSTEM = `You are a Brand Intelligence Agent for an Instagram AI marketing system.
Your job: analyze brand data and return structured brand intelligence.
ALWAYS return valid JSON only. No prose.`;

export async function analyzeBrand(input: {
  name: string;
  description: string;
  niche: string;
  targetAudience: string;
  keywords?: string[];
  language?: string;
}): Promise<Brand> {
  const prompt = `Analyze this brand and return a complete Brand JSON object.

Brand input:
${JSON.stringify(input, null, 2)}

Return JSON with this exact shape:
{
  "id": "generated_id",
  "name": string,
  "description": string,
  "colorPalette": [3-5 hex colors that match brand feel],
  "toneOfVoice": "professional|friendly|bold|playful|inspirational|educational",
  "targetAudience": string,
  "keywords": [10 relevant keywords],
  "positioning": string (one sentence brand positioning statement),
  "niche": string,
  "language": "tr|en",
  "updatedAt": ISO date
}`;

  const raw = await runClaude(SYSTEM, prompt);
  const parsed = parseJSON<Partial<Brand>>(raw, {});
  const brand: Brand = {
    id: parsed.id ?? generateId(),
    name: parsed.name ?? input.name,
    description: parsed.description ?? input.description,
    colorPalette: parsed.colorPalette ?? ["#6371f5", "#a855f7", "#ec4899"],
    toneOfVoice: parsed.toneOfVoice ?? "professional",
    targetAudience: parsed.targetAudience ?? input.targetAudience,
    keywords: parsed.keywords ?? input.keywords ?? [],
    positioning: parsed.positioning ?? "",
    niche: parsed.niche ?? input.niche,
    language: parsed.language ?? input.language ?? "tr",
    updatedAt: new Date().toISOString(),
  };
  memory.saveBrand(brand);
  return brand;
}

export async function getBrandInsights(): Promise<{
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: string[];
}> {
  const brand = memory.getBrand();
  if (!brand) throw new Error("No brand configured");

  const prompt = `Based on this brand profile, provide strategic insights.
Brand: ${JSON.stringify(brand, null, 2)}

Return JSON:
{
  "strengths": [3-5 items],
  "weaknesses": [2-3 items],
  "opportunities": [3-5 items],
  "recommendations": [5 actionable items]
}`;

  const raw = await runClaude(SYSTEM, prompt);
  return parseJSON(raw, {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    recommendations: [],
  });
}
