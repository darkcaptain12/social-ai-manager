import { runAI, parseJSON } from "./base";
import { memory } from "@/lib/memory/store";
import { generateId } from "@/lib/utils";
import type { Brand } from "@/types";

const SYSTEM = `You are a Brand Intelligence Agent. Analyze brand data and return structured brand intelligence. ALWAYS return valid JSON only.`;

export async function analyzeBrand(input: {
  name: string; description: string; niche: string;
  targetAudience: string; keywords?: string[]; language?: string;
}): Promise<Brand> {
  const prompt = `Analyze this brand and return a complete Brand JSON object.
Brand input: ${JSON.stringify(input, null, 2)}
Return JSON:
{
  "id": "generated_id",
  "name": string,
  "description": string,
  "colorPalette": [3-5 hex colors],
  "toneOfVoice": "professional|friendly|bold|playful|inspirational|educational",
  "targetAudience": string,
  "keywords": [10 keywords],
  "positioning": string,
  "niche": string,
  "language": "tr|en",
  "updatedAt": ISO date
}`;

  const raw = await runAI(SYSTEM, prompt);
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
  await memory.saveBrand(brand);
  return brand;
}

export async function getBrandInsights(): Promise<{
  strengths: string[]; weaknesses: string[]; opportunities: string[]; recommendations: string[];
}> {
  const brand = await memory.getBrand();
  if (!brand) throw new Error("No brand configured");

  const prompt = `Based on this brand profile, provide strategic insights.
Brand: ${JSON.stringify(brand, null, 2)}
Return JSON: { "strengths": [3-5], "weaknesses": [2-3], "opportunities": [3-5], "recommendations": [5] }`;

  const raw = await runAI(SYSTEM, prompt);
  return parseJSON(raw, { strengths: [], weaknesses: [], opportunities: [], recommendations: [] });
}
