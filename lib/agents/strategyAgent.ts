import { runClaude, parseJSON } from "./base";
import { memory } from "@/lib/memory/store";
import type { ContentStrategy, ContentPillar } from "@/types";

const SYSTEM = `You are a Content Strategy Agent for Instagram.
Create data-driven, actionable content strategies.
ALWAYS return valid JSON only.`;

export async function generateStrategy(): Promise<ContentStrategy> {
  const brand = memory.getBrand();
  const competitors = memory.getCompetitors();
  const audience = memory.getAudience();
  const trends = memory.getTrends().slice(0, 5);

  if (!brand) throw new Error("Brand not configured");

  const prompt = `Create a comprehensive Instagram content strategy.

Brand: ${JSON.stringify(brand)}
Audience: ${JSON.stringify(audience)}
Top trends: ${JSON.stringify(trends)}
Competitor landscape: ${competitors.length} analyzed competitors

Return JSON:
{
  "pillars": [
    {
      "id": string,
      "name": string,
      "description": string,
      "percentage": number (all must sum to 100),
      "color": hex_color
    }
  ],
  "postingFrequency": "X posts per week",
  "optimalTimes": ["HH:MM", ...5 times],
  "campaignIdeas": [5 campaign ideas with titles],
  "weeklyPlan": {
    "monday": [{ "type": "post|story|reel", "objective": "awareness|engagement|conversion|education|entertainment", "caption": string, "hook": string, "cta": string, "hashtags": [20], "pillar": string }],
    "tuesday": [...],
    "wednesday": [...],
    "thursday": [...],
    "friday": [...],
    "saturday": [...],
    "sunday": [...]
  },
  "generatedAt": ISO_date
}

Make 4-5 content pillars. Put 1-2 content items per day in weeklyPlan.`;

  const raw = await runClaude(SYSTEM, prompt);
  const parsed = parseJSON<Partial<ContentStrategy>>(raw, {});

  const strategy: ContentStrategy = {
    pillars: (parsed.pillars ?? defaultPillars()) as ContentPillar[],
    postingFrequency: parsed.postingFrequency ?? "5 posts per week",
    optimalTimes: parsed.optimalTimes ?? ["09:00", "12:00", "18:00", "20:00"],
    campaignIdeas: parsed.campaignIdeas ?? [],
    weeklyPlan: parsed.weeklyPlan ?? {},
    generatedAt: new Date().toISOString(),
  };

  memory.saveStrategy(strategy);
  return strategy;
}

function defaultPillars(): ContentPillar[] {
  return [
    { id: "edu", name: "Eğitim", description: "Bilgi ve değer içerikleri", percentage: 30, color: "#6371f5" },
    { id: "eng", name: "Etkileşim", description: "Topluluk katılım içerikleri", percentage: 25, color: "#a855f7" },
    { id: "promo", name: "Tanıtım", description: "Ürün/hizmet tanıtımları", percentage: 20, color: "#ec4899" },
    { id: "insp", name: "İlham", description: "Motivasyonel içerikler", percentage: 15, color: "#f59e0b" },
    { id: "bts", name: "Sahne Arkası", description: "Marka hikayesi", percentage: 10, color: "#10b981" },
  ];
}
