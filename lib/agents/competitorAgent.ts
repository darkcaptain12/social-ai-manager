import { runClaude, parseJSON } from "./base";
import { memory } from "@/lib/memory/store";
import { generateId } from "@/lib/utils";
import type { Competitor } from "@/types";

const SYSTEM = `You are a Competitor Analysis Agent. Analyze Instagram competitors and find content gaps. ALWAYS return valid JSON only.`;

export async function analyzeCompetitor(input: { name: string; instagramHandle: string; niche?: string }): Promise<Competitor> {
  const brand = await memory.getBrand();
  const prompt = `Analyze this Instagram competitor for a brand in the ${brand?.niche ?? "marketing"} niche.
Competitor: ${JSON.stringify(input)}
Our brand: ${brand ? JSON.stringify({ name: brand.name, niche: brand.niche, positioning: brand.positioning }) : "unknown"}
Return JSON:
{
  "id": "id", "name": string, "instagramHandle": string,
  "followerCount": number, "engagementRate": number (0-10),
  "contentStyle": string, "postingFrequency": "X per week",
  "topHashtags": [10], "contentGaps": [3-5], "opportunities": [3-5]
}`;

  const raw = await runClaude(SYSTEM, prompt);
  const parsed = parseJSON<Partial<Competitor>>(raw, {});
  const competitor: Competitor = {
    id: parsed.id ?? generateId(),
    name: parsed.name ?? input.name,
    instagramHandle: parsed.instagramHandle ?? input.instagramHandle,
    followerCount: parsed.followerCount,
    engagementRate: parsed.engagementRate,
    contentStyle: parsed.contentStyle,
    postingFrequency: parsed.postingFrequency,
    topHashtags: parsed.topHashtags ?? [],
    contentGaps: parsed.contentGaps ?? [],
    opportunities: parsed.opportunities ?? [],
    lastAnalyzed: new Date().toISOString(),
  };
  await memory.addCompetitor(competitor);
  return competitor;
}

export async function getCompetitiveReport(): Promise<{
  summary: string; marketGaps: string[]; winningAngles: string[]; contentIdeas: string[];
}> {
  const competitors = await memory.getCompetitors();
  const brand = await memory.getBrand();
  if (competitors.length === 0) throw new Error("No competitors analyzed yet");

  const prompt = `Generate a competitive intelligence report.
Brand: ${JSON.stringify(brand)}
Competitors: ${JSON.stringify(competitors)}
Return JSON: { "summary": string, "marketGaps": [5], "winningAngles": [5], "contentIdeas": [10] }`;

  const raw = await runClaude(SYSTEM, prompt);
  return parseJSON(raw, { summary: "", marketGaps: [], winningAngles: [], contentIdeas: [] });
}
