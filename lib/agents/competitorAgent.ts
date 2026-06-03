import { runClaude, parseJSON } from "./base";
import { memory } from "@/lib/memory/store";
import { generateId } from "@/lib/utils";
import type { Competitor } from "@/types";

const SYSTEM = `You are a Competitor Analysis Agent for Instagram marketing.
Analyze competitors and find content gaps and opportunities.
ALWAYS return valid JSON only.`;

export async function analyzeCompetitor(input: {
  name: string;
  instagramHandle: string;
  niche?: string;
}): Promise<Competitor> {
  const brand = memory.getBrand();
  const prompt = `Analyze this Instagram competitor for a brand in the ${brand?.niche ?? "marketing"} niche.

Competitor: ${JSON.stringify(input)}
Our brand: ${brand ? JSON.stringify({ name: brand.name, niche: brand.niche, positioning: brand.positioning }) : "unknown"}

Return JSON:
{
  "id": "generated_id",
  "name": string,
  "instagramHandle": string,
  "followerCount": estimated_number,
  "engagementRate": estimated_percentage (0-10),
  "contentStyle": string description,
  "postingFrequency": "X posts per week",
  "topHashtags": [10 likely hashtags],
  "contentGaps": [3-5 things they don't cover well],
  "opportunities": [3-5 opportunities for our brand]
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
  memory.addCompetitor(competitor);
  return competitor;
}

export async function getCompetitiveReport(): Promise<{
  summary: string;
  marketGaps: string[];
  winningAngles: string[];
  contentIdeas: string[];
}> {
  const competitors = memory.getCompetitors();
  const brand = memory.getBrand();
  if (competitors.length === 0) throw new Error("No competitors analyzed yet");

  const prompt = `Generate a competitive intelligence report.

Our brand: ${JSON.stringify(brand)}
Competitors: ${JSON.stringify(competitors)}

Return JSON:
{
  "summary": string (2-3 sentence overview),
  "marketGaps": [5 underserved opportunities],
  "winningAngles": [5 positioning angles we can dominate],
  "contentIdeas": [10 content ideas based on gaps]
}`;

  const raw = await runClaude(SYSTEM, prompt);
  return parseJSON(raw, {
    summary: "",
    marketGaps: [],
    winningAngles: [],
    contentIdeas: [],
  });
}
